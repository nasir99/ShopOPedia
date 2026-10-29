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

Submitting the order form on a product card saves an order document in the Firestore
`orders` collection before showing the email links. Each document includes a customer
contact/delivery snapshot, product name/category/price snapshot, quantity, a `pending`
status, and a server-generated creation timestamp. The customer can then open Gmail or
their default mail app to send the same order details to the shop.

Only admins can read orders. The admin navigation includes an **Orders** page at `/orders`,
which lists saved orders newest first. The Firestore rules validate public order submissions
and restrict reads to admins. Deploy updated rules before using this feature:

```sh
firebase deploy --only firestore:rules
```

Order forms contain personal information and the create rule permits unauthenticated
submissions. For a public production storefront, add Firebase App Check and abuse controls
before collecting real customer data.
