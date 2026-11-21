import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AppProvider } from './context/AppContext';
import App from './App';
import './styles/style.scss';
import './styles/workspace-pages.scss';
import './styles/admin-dashboard.scss';
import './styles/theme.scss';
import { ThemeProvider } from './context/ThemeContext';

const fallback = document.getElementById('progressive-fallback');
if (fallback) {
  fallback.hidden = true;
  // The skip link must target the active page, not the hidden HTML fallback.
  fallback.querySelector('#main-content')?.removeAttribute('id');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
