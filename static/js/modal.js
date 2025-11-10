import { showFlash } from "./flash.js";

document.addEventListener("DOMContentLoaded", () => {
  // Activate editTitle onclick
  const titleSpan = document.getElementById("modal-title");
  titleSpan.addEventListener("click", editTitle);
  // Activate saveTitle onblur
  const titleInput = document.getElementById("modal-title-input");
  titleInput.value = "New Event";
  titleInput.addEventListener("blur", saveTitle);

  // Save on Enter key
  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleInput.blur();
    }
  });

  const modalEl = document.getElementById("modal");
  // This runs every time the modal is about to hide
  modalEl.addEventListener("hide.bs.modal", () => {
    const focused = document.activeElement;
    // Check if the focused element is inside the modal
    if (modalEl.contains(focused)) {
      focused.blur();
    }
  });
});

// Titel functions
function editTitle() {
  const span = document.getElementById("modal-title");
  const input = document.getElementById("modal-title-input");

  input.value = span.textContent;
  span.style.display = "none";
  input.style.display = "inline-block";
  input.focus();
  input.select(); // select all text
}

function saveTitle() {
  const span = document.getElementById("modal-title");
  const input = document.getElementById("modal-title-input");
  const newText = input.value.trim();
  span.textContent = newText;
  if (newText === "") {
    input.placeholder = "Title is required";
    input.classList.add("is-invalid");
    return;
  }
  input.classList.remove("is-invalid");
  input.style.display = "none";
  span.style.display = "inline";
}

// Modal functions
export function setVisibilityModal(showModal) {
  const $modalEl = $("#modal");
  if (!$modalEl) {
    console.error("HTTP error: 404 could not find modal!");
    return null;
  }
  if (showModal) {
    bootstrap.Modal.getOrCreateInstance($modalEl).show();
    return true;
  } else {
    bootstrap.Modal.getOrCreateInstance($modalEl).hide();
    return false;
  }
}

export function fillModalForEdit(event) {
  const $modalEl = $("#modal");
  if (!$modalEl) return;

  // 1. Setup date format
  const formatOptions = {
    day: "2-digit", // ex: '05'
    month: "2-digit", // ex: '04'
    year: "numeric", // ex: '2006'
    timeZone: "Europe/Amsterdam", // Specify time zone
  };

  // 2. Retrieve all editable fields
  const $titleSpanEl = $modalEl.find("#modal-title");
  const $descriptionTextareaEl = $("#event-description");
  const $startDateInputEl = $("#event-datepicker-start");
  const $endDateInputEl = $("#event-datepicker-end");
  const $eventIdInputEl = $("#event-id-input");

  // 3. Fill in the retrieved data for the editable fields
  $eventIdInputEl.val(event.id);
  $titleSpanEl.text(event.title);
  $descriptionTextareaEl.val(event.extendedProps.description || "");

  // 4. Counteract the specs of ICalendar for better visual representation
  const startDate = event.start;
  const endDate = event.end;
  const newEndDate = endDate.setDate(endDate.getDate() - 1);

  // 5. Format end date back & start date
  const customDutchFormat = new Intl.DateTimeFormat("nl-NL", formatOptions);
  const fortmattedStartDate = customDutchFormat.format(startDate);
  const formattedEndDate = customDutchFormat.format(endDate);
  const formattedNewEndDate = customDutchFormat.format(newEndDate);

  // 6. Fill in the dates
  $startDateInputEl.val(fortmattedStartDate);
  $endDateInputEl.val(formattedNewEndDate);

  // 7. Fill in bootstrap-datepicker
  $("#event-datepicker-start").datepicker("update", fortmattedStartDate);
  $("#event-datepicker-end").datepicker("update", formattedEndDate);
}

export function setupModalForCreate(calendar) {
  // Get submit button el
  const $submitButtonEl = $("#submit-event-button");

  // New event handler
  $submitButtonEl.off("click").on("click", function (e) {
    // Makes it so that the normal action is not run
    e.preventDefault();
    const $formEl = $("#modal-form")[0];
    const formData = new FormData($formEl);
    fetch("/events/new", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (response.ok) {
          // Refetch the calendar
          calendar.refetchEvents();
          // If we have the modal el, hide it
          const modalShowed = setVisibilityModal(false);
          if (modalShowed === null) {
            return;
          }
          resetModalForNew();
          showFlash("success", "Event succesfully saved!");
        } else {
          // Because of async, to receive the error
          const data = await response.json();
          console.error("Error: Cannot edit event. " + data.error);
          showFlash("danger", data.error);
        }
      })
      .catch((error) => {
        console.error("Error saving event:", error);
        showFlash("danger", "Error saving event:" + error);
      });
  });
}

export function setupModalForUD(calender, event) {
  const $deleteButtonEl = $("#delete-event-button");
  const $submitButtonEl = $("#submit-event-button");
  const $formEl = $("#modal-form")[0];

  // 1. Check if parameters are not null
  if (!calender) {
    errorStr = "HTTP error: 404 could not find calendar!";
    console.error(errorStr);
    showFlash("danger", errorStr);
    return;
  } else if (!event) {
    errorStr = "HTTP error: 404 could not find event!";
    console.error(errorStr);
    showFlash("danger", errorStr);
    return;
  }

  // 2. Set up ui for edit / delete mode
  $submitButtonEl.text("Edit event");
  $deleteButtonEl.show();

  // 3. Edit handler
  // .off() for deleting older handelers
  $submitButtonEl.off("click").on("click", function (e) {
    e.preventDefault();
    const formData = new FormData($formEl);
    fetch("/events/edit/" + event.id, {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (response.ok) {
          // If we have the event obj, refetch the event & hide the modal
          if (event) {
            calender.refetchEvents();
            const modalShowed = setVisibilityModal(false);
            if (modalShowed === null) {
              return;
            }
            showFlash("success", "Event succesfully edited and saved!");
            // Otherwise refresh using page reload
          } else {
            window.location.reload();
          }
          resetModalForNew();
        } else {
          // Because of async, to receive the error
          const data = await response.json();
          console.error("Error: Cannot edit event. " + data.error);
          showFlash("danger", data.error);
        }
      })
      .catch((error) => {
        console.error("Error editing event:", error);
        showFlash("danger", "Error editing event:" + error);
      });
  });

  // 4. Delete handler
  $deleteButtonEl.off("click").on("click", function (e) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete it?")) {
      fetch("/events/delete/" + event.id, {
        method: "DELETE",
      })
        .then(async (response) => {
          if (response.ok) {
            // If we have the event obj, remove the event & hide the modal
            if (event) {
              event.remove();
              const modalShowed = setVisibilityModal(false);
              if (modalShowed === null) {
                return;
              }
              showFlash("success", "Event succesfully deleted!");
              // Otherwise refresh using page reload
            } else {
              window.location.reload();
            }
          } else {
            const data = await response.json();
            console.error("Error: Cannot delete event. " + data.error);
            showFlash("danger", data.error);
          }
        })
        .catch((error) => {
          console.error("Error deleting event:", error);
          showFlash("danger", "Error deleting event:" + error);
        });
    }
  });
}

export function resetModalForNew() {
  const $modalEl = $("#modal");
  if (!$modalEl) return;
  // Retrieve all input fields & empty them
  $modalEl.find("#modal-title").text("New Event");
  $("#event-description").val("");
  $("#event-datepicker-start").val("");
  $("#event-datepicker-end").val("");
  $("#event-id-input").val("");
  $("#delete-event-button").hide();
  $("#submit-event-button").text("Save event");
}
