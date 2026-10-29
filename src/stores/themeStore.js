import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('themeStore', () => {
  const savedTheme = localStorage.getItem('theme')
  const theme = ref(savedTheme === 'dark' ? 'dark' : 'light')

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      throw new Error(`Unsupported theme: ${newTheme}`)
    }

    theme.value = newTheme
    document.body.setAttribute('data-bs-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return {
    theme,
    setTheme,
  }
})
