import Swal from 'sweetalert2';
import '../swalHelper/SwalHelper.scss';
/*#region React-Toastify*/
import { toast } from 'react-toastify';
const notifySuccess = () => toast.success("Success message");
const notifyError = () => toast.error("Error message");
const notifyWarning = () => toast.warning("Warning message");
const notifyInfo = () => toast.info("Info message");
/*#endregion React-Toastify*/

const SweetAlert = (
    width = '400',
    title,
    titleClass = '',
    html,
    showConfirmButton = true,
    confirmButtonText = "ok",
    confirmButtonClass = '',
    showCancelButton = true,
    cancelButtonText = "Cancel",
    cancelButtonClass = '',
    showCloseButton = false,
    closeButtonClass = '',
    text,
    icon,
    containerClass = '',
    popupClass = '',
    headerClass = '',
    iconClass = '',
    imageClass = '',
    htmlContainerClass = '',
    inputClass = '',
    inputLabelClass = '',
    validationMessageClass = '',
    actionsClass = '',
    denyButtonClass = '',
    loaderClass = '',
    footerClass = '',
    timerProgressBarClass = '',
    inputText = '',
    input = false,
    confirmCallback = () => { }, // Callback for when confirmed
    cancelCallback = () => { } // Callback for when canceled
) => {
    const customSwal = Swal.mixin({
        customClass: {
            container: `containerClass ${containerClass}`,
            popup: `popupClass ${popupClass}`,
            header: `headerClass ${headerClass}`,
            title: `titleClass ${titleClass}`,
            closeButton: `closeButtonClass ${closeButtonClass}`,
            icon: `iconClass ${iconClass}`,
            image: `imageClass ${imageClass}`,
            htmlContainer: `htmlContainerClass ${htmlContainerClass}`,
            input: `inputClass ${inputClass}`,
            inputLabel: `inputLabelClass ${inputLabelClass}`,
            validationMessage: `validationMessageClass ${validationMessageClass}`,
            actions: `actionsClass ${actionsClass}`,
            confirmButton: `confirmButtonClass ${confirmButtonClass}`,
            denyButton: `denyButtonClass ${denyButtonClass}`,
            cancelButton: `cancelButtonClass ${cancelButtonClass}`,
            loader: `loaderClass ${loaderClass}`,
            footer: `footerClass ${footerClass}`,
            timerProgressBar: `timerProgressBarClass ${timerProgressBarClass}`,
        },
        buttonsStyling: false,
    });

    return (
        customSwal.fire({
            heightAuto: false,
            title: title,
            text: text,
            icon: icon,
            html: html,
            width: width,
            showCloseButton: showCloseButton,
            showCancelButton: showCancelButton,
            cancelButtonText: cancelButtonText,
            showConfirmButton: showConfirmButton,
            confirmButtonText: confirmButtonText,
            input: input ? inputText : null 
        }).then((result) => {
            if (result.isConfirmed) {
                // Confirmed action
                confirmCallback(result); // Trigger the confirm callback
                // notifySuccess();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Canceled action
                cancelCallback(result); // Trigger the cancel callback
                // notifyError();
            }
        })
    );
};

export default SweetAlert;
