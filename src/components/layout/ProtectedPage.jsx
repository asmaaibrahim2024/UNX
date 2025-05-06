
import React from 'react';
import { Navigate } from 'react-router-dom';
import { RolesGuard } from '../../handlers/authHandlers/rolesGuardHandler';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// const ProtectedRoute = ({ children }) => {
//   const isAuthorized = RolesGuard.canActivate();

//    return isAuthorized ? children : <Navigate to="/error/500" replace />;

// };
// const ProtectedRoute = ({ children }) => {
//   const lsValue = localStorage.getItem('AuthModleLocalStorage');

//   if (lsValue) {
//     return children;
//   }

//   const isAuthorized = RolesGuard.canActivate();

//   return isAuthorized ? children : <Navigate to="/error/500" replace />;
// };
const ProtectedRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null); // null = loading
  const user = useSelector((state) => state.layoutReducer.userDataIntial);
  const lsValue = localStorage.getItem('AuthModleLocalStorage');

  useEffect(() => {
    const checkAccess = async () => {
      if (!lsValue) {
        setIsAllowed(false);
        return;
      }
      const result = await RolesGuard.canActivate();
      setIsAllowed(result);
    };

    if (user !== null) {
      checkAccess();
    }
  }, [user]);

  if (user === null || isAllowed === null) {
    return <div>Loading...</div>;
  }

  if (!isAllowed || !user) {
    return <Navigate to="/error/500" replace />;
  }

  return children;
};


 export default ProtectedRoute;
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { RolesGuard } from '../../handlers/authHandlers/rolesGuardHandler';

// const ProtectedRoute = ({ children }) => {
  
//   const lsValue = localStorage.getItem('AuthModleLocalStorage');

//   // If no auth info, redirect to login
//   if (!lsValue) {
//     window.location.href = `${window.appConfig.apiServer.utilityKitURL}/auth/login`;
//     return null; // prevent rendering during redirect
//   }

//   const isAuthorized = RolesGuard.canActivate(() => {
//     // Fallback redirect if role is invalid
//     window.location.href = `${window.appConfig.apiServer.utilityKitURL}/auth/login`;
//   });

//   // If not authorized (but already redirected above), fallback to error
//   return isAuthorized ? children : <Navigate to="/error/500" replace />;
// };

// export default ProtectedRoute;
