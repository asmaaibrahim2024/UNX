import logo from './logo.svg';
import './App.css';
import Layout from "./components/layout/Layout";
import {  Route, Routes, BrowserRouter, Navigate } from 'react-router-dom';
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n/i18n";
import { useHeaderLanguage } from "./handlers/languageHandler";

function App() {

  useHeaderLanguage({
    lang: i18n.language,
    dir: i18n.dir(i18n.language),
  });

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </I18nextProvider>
  );

}

export default App;
