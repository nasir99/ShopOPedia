# ShopOPedia

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Roles and authorization

The app supports `user` and `admin` roles stored in each user's Firestore document at
`users/{uid}`. New registrations are always assigned the `user` role. Product management
routes require an authenticated admin; signed-in users without the admin role are sent to
the access-denied page.

To grant admin access, use the Firebase console to change that account's
`users/{uid}.role` field to `admin`. Do not grant roles from client-side registration or
allow users to edit their own role.

Deploy the Firestore rules in `firestore.rules` to enforce product write permissions at the
database as well as in the UI. For example, with the Firebase CLI installed and the project
selected:

```sh
firebase deploy --only firestore:rules
```

Product reads remain public for the storefront; creating, updating, and deleting products
requires the admin role.

The home page displays up to 8 products per page. The admin product-management and orders
pages display up to 10 records per page.

## Customer orders

Submitting an order saves one order document in the Firestore `orders` collection. Customers
can order an individual product or check out every product in the shopping bag together; a bag
checkout stores all product/quantity/price snapshots on the same order. Each document includes
the customer contact/delivery snapshot, a `pending` status, the `swish` payment method, and a
server-generated creation timestamp. Catalog prices are treated as Swedish kronor (SEK). After
saving, the customer sees the Swish recipient, combined order total, and order ID to enter as the
payment message, then can open Gmail or their default mail app to send all order details to the
shop. A successful bag checkout clears the cart. This is a manual transfer; the app does not
initiate or automatically verify Swish payments.

Only admins can read orders. The admin navigation includes an **Orders** page at `/orders`,
which lists saved orders newest first. Admins can update an order's status to pending,
confirmed, processing, completed, or cancelled from the order list. Firestore rules limit
admin order updates to the status field and validate the allowed values. Deploy updated rules
before using this feature:

```

Admins can also open **Reviews & best sellers** from the navigation at `/admin/insights`.
It lists recent product reviews (up to 50 per product) and ranks the top 10 products by
quantity in completed orders.sh
firebase deploy --only firestore:rules
```

Order forms contain personal information and the create rule permits unauthenticated
submissions. For a public production storefront, add Firebase App Check and abuse controls
before collecting real customer data.

## AI shopping features

The app's AI calls run in Firebase Cloud Functions (`functions/`) and call Azure OpenAI from
the server. The Azure API key is a Functions secret; never add it to Vite environment
variables or the browser bundle. Deployments use the `europe-west1` Functions region.

The implementation includes:

- Natural-language and image-based product search with product IDs ranked by relevance.
- A floating shopping assistant that can use the current conversation, cart, wishlist, recent
  views, search history, and available purchase history to recommend catalog items.
- AI recommendations, similar products, customers-also-bought, and frequently-bought-together
  sections where sufficient profile and completed-order data exists.
- Cart, wishlist, views, and search history saved in browser storage for guests and synced to
  the signed-in user's `users/{uid}/shopperProfiles/preferences` document. Purchase history
  is recorded by the backend when an associated signed-in customer's order is marked
  completed.
- Admin product-form generation of tags, SEO title/description, Open Graph fields, and
  Product JSON-LD. Generated values are saved with the product when the form is submitted.
- Signed-in customer reviews stored at `products/{productId}/reviews`, with an AI summary
  based on those submitted reviews.

The assistant sends relevant chat and shopping context to Azure OpenAI. Visual search sends
the selected image for analysis (JPEG, PNG, or WebP, up to 3 MB); the image is not saved by
the app. Don't include sensitive personal information in assistant prompts. Review
`firestore.rules` before deployment: it restricts shopper-profile writes to the account owner,
review writes to authenticated users, admin metadata generation to admins, and purchases to
server-side/admin access.

### Configure and deploy AI

Use an Azure OpenAI chat-completions deployment. The Functions backend uses the Azure OpenAI
v1 endpoint (`/openai/v1/chat/completions`), so the endpoint can be the resource URL or include
the `/openai/v1` suffix; no dated API version is required. Set `AZURE_OPENAI_DEPLOYMENT` to the
deployment name in Azure, not necessarily the model family name. A chat-capable deployment such
as GPT-4o-mini is needed for the assistant and structured AI features; visual search additionally
requires image-input support. Copy `functions/.env.example` to
`functions/.env.shopopedia-f5651` and verify the endpoint and deployment name. The local env
file is ignored by Git. Set the API key as a Firebase secret; do not put it in the env file:

```powershell
firebase functions:secrets:set AZURE_OPENAI_API_KEY --project shopopedia-f5651
npm run functions:build
firebase deploy --only functions,firestore:rules --project shopopedia-f5651
```

Deploying Cloud Functions requires the Firebase project to have the required billing and
Functions APIs enabled. AI actions return an explicit error until the Functions and Azure
deployment settings are configured. The browser does not call Azure directly.

For the function callable contracts and validation limits, see
[`functions/src/index.ts`](./functions/src/index.ts).
