// src/pages/NotFound404.js

import React from "react";
import { Link } from "react-router-dom";
 import darkError from "../../style/images/not-authorized.png";

const NotFound404 = () => {
  return (
    <div className="text-center p-5">
      {/* Illustration */}
      <div className="mb-10">
        <img
          src={darkError}
          className="mw-100 mh-300px theme-dark-show"
          alt="404 Dark"
        />
      </div>

      {/* Title */}
      <h1 className="fw-bolder fs-2hx text-gray-900 mb-4">
        We can't find that page
      </h1>

      {/* Text */}
      <div className="fw-semibold fs-6 text-gray-500 mb-7">
        Click return home to go back to the home screen.
      </div>

      {/* Link */}
      <div className="mb-0">
   <Link
    to={window.appConfig.apiServer.utilityKitURL}
    className="btn btn-dark"
    onClick={() => localStorage.removeItem('AuthModleLocalStorage')}
  >
        Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound404;
