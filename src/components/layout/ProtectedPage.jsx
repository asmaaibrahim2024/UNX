// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { RolesGuard } from '../../handlers/authHandlers/rolesGuardHandler';

// const ProtectedPage = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const isAllowed = RolesGuard.canActivate(() => {
//       navigate('/error/500'); // Redirect if unauthorized
//     });

//     if (!isAllowed) return;
//   }, [navigate]);

//   return (
//     <div>
//       {/* Protected content here */}
//       <h1>Protected Content</h1>
//     </div>
//   );
// };

// export default ProtectedPage;
import React from 'react';
import { Navigate } from 'react-router-dom';
import { RolesGuard } from '../../handlers/authHandlers/rolesGuardHandler';

const ProtectedRoute = ({ children }) => {
  const isAuthorized = RolesGuard.canActivate();

  return isAuthorized ? children : <Navigate to="/error/500" replace />;
};

export default ProtectedRoute;