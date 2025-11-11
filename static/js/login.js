import { showFlash } from "./flash.js";

$(function () {
  const $loginButton = $("#submit-login-button");
  // New event handler
  $loginButton.off("click").on("click", function (e) {
    // Makes it so that the normal action is not run
    e.preventDefault();
    const formEl = $("#login-form")[0];
    const formData = new FormData(formEl);
    fetch("/login", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (response.ok) {
          window.location.href = response.url;
        } else {
          // Because of async, to receive the error
          const data = await response.json();
          console.error("Error: Cannot login. " + data.error);
          showFlash("danger", data.error);
        }
      })
      .catch((error) => {
        console.error("Error logging in:", error);
        showFlash("danger", "Error logging in:" + error);
      });
  });
});
