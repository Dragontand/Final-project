import { showFlash } from "./flash.js";

$(function () {
  const $registerButton = $("#submit-register-button");
  // New event handler
  $registerButton.off("click").on("click", function (e) {
    // Makes it so that the normal action is not run
    e.preventDefault();
    const formEl = $("#login-form")[0];
    const formData = new FormData(formEl);
    fetch("/register/new", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (response.ok) {
          window.location.href = response.url;
        } else {
          // Because of async, to receive the error
          const data = await response.json();
          console.error("Error: Cannot register. " + data.error);
          showFlash("danger", data.error);
        }
      })
      .catch((error) => {
        console.error("Error with registration:", error);
        showFlash("danger", "Error with registration:" + error);
      });
  });
});