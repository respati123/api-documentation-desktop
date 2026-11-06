import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/shared/i18n'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/500.css'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element.')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
