// import { UserRolesService } from "./userRolesHandler"; 

// export const RolesGuard = (() => {
//   const allowedRoles = ['Administrator', 'Editor', 'Auditor', 'Viewer'];

//   function canActivate(navigateToError = () => {}) {
//     debugger
//     // Ensure roles are refreshed from local storage
//     const appCode = window.appConfig.apiServer.appCode || '';
//     UserRolesService.getRoles(appCode);
//     const unxRole = UserRolesService.getUnxRole();

//     if (unxRole && allowedRoles.includes(unxRole)) {
//       return true;
//     } else {

//       navigateToError(); // You can redirect using useNavigate or window.location.href
//       return false;
//     }
//   }

//   return {
//     canActivate,
//   };
// })();
import { UserRolesService } from "./userRolesHandler"; 

export const RolesGuard = (() => {
  const allowedRoles = ['Administrator', 'Editor', 'Auditor', 'Viewer'];

  async function canActivate() {
    debugger
    const appCode = window?.appConfig?.apiServer?.appCode || '';

    try {
      await UserRolesService.getRoles(appCode); // Ensure roles are loaded
      const unxRole = UserRolesService.getUnxRole();

      return !!(unxRole && allowedRoles.includes(unxRole));
    } catch (error) {
      console.error("RolesGuard canActivate error:", error);
      return false;
    }
  }

  return {
    canActivate,
  };
})();
