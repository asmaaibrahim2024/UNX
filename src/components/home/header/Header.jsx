import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Header.scss";
import logo from "../../../style/images/logoUNX.svg";
import lang from "../../../style/images/lang.svg";
import langEN from "../../../style/images/langEN.svg";
import avatar from "../../../style/images/avatar.svg";
import logOut from "../../../style/images/log-out.svg";
import { useI18n } from "../../../handlers/languageHandler";
import { changeLanguage } from "../../../redux/layout/layoutAction";
import { AuthService } from "../../../handlers/authHandlers/authServiceHandler"; // Import your AuthService

export default function Header() {
  const { t, i18nInstance } = useI18n("Sidebar");
  const [activeButton, setActiveButton] = useState(null);
  const dispatch = useDispatch();
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const user = useSelector((state) => state.layoutReducer.userDataIntial);

  const toggleLanguage = () => {
    const lng = language === "en" ? "ar" : "en"; // toggle logic
    i18nInstance.changeLanguage(lng);
    dispatch(changeLanguage(lng));
  };
  const handleLogout = () => {
    AuthService.logout();
  };
  return (
    <>
      <header className="header">
        <img src={logo} alt="logo" />
        <div className="header-right">
          <img
            src={language === "en" ? lang : langEN}
            alt="language"
            onClick={toggleLanguage}
          />
          <div className="header-avatar">
            <div className="avatar-img">
              <img src={avatar} alt="user-avatar" />
            </div>
            <div className="user-info">
              {user && <h4>{user.userName}</h4>}
              {user && <span>{user.email}</span>}
            </div>
          </div>
          <img src={logOut} alt="language" onClick={handleLogout} />{" "}
        </div>
      </header>
    </>
  );
}
