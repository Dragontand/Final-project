// Own imports
import {
  setVisibilityModal,
  fillModalForEdit,
  setupModalForCreate,
  setupModalForUD,
  resetModalForNew,
} from "./modal.js";
// Fullcalendar imports
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";

document.addEventListener("DOMContentLoaded", () => {
  // To remove Jquery wrapper for Fullcalendar
  const calendarEl = $("#calendar")[0];
  // Only run if the page has a calendar
  if (!calendarEl) return;
  const calendar = new Calendar(calendarEl, {
    // Config
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
    initialView: "dayGridMonth",
    selectable: true,

    // Header toolbar
    headerToolbar: {
      left: "prev next today addEvent",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },

    buttonText: {
      today: "Today",
      month: "Month",
      week: "Week",
      day: "Day",
      list: "List",
    },

    // Custom buttons
    customButtons: {
      addEvent: {
        //icon: 'custom-icon-class',  Then style it in CSS
        text: "+ Event",
        click: function () {
          resetModalForNew();

          // Trigger modal
          const modalShowed = setVisibilityModal(true);
          if (modalShowed === null) {
            return;
          }
          setupModalForCreate(calendar);
        },
      },
    },

    events: "/events",

    // Clicking on event
    eventClick: function (info) {
      const event = info.event;

      fillModalForEdit(event);
      setupModalForUD(calendar, event);

      // Show modal
      const modalShowed = setVisibilityModal(true);
      if (modalShowed === null) {
        return;
      }

      info.jsEvent.preventDefault();
    },
    // Formats
    eventTimeFormat: {
      // like '14:30'
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
      hour12: false,
    },

    slotLabelFormat: {
      // like '14:30'
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
      hour12: false,
    },
  });

  calendar.render();

  // Add Bootstrap modal attributes to the custom button
  const btn = document.querySelector(".fc-addEvent-button");
  if (btn) {
    btn.setAttribute("data-bs-toggle", "modal");
    btn.setAttribute("data-bs-target", "#modal");
    btn.setAttribute("data-bs-name", "New Event");
  }

  // Handles modal content updates
  const modalEl = $("#modal")[0];
  if (modalEl) {
    modalEl.addEventListener("show.bs.modal", (event) => {
      const buttonEl = event.relatedTarget;
      if (buttonEl) {
        const modalName = buttonEl.getAttribute("data-bs-name");

        const modalTitle = modalEl.querySelector(".modal-title");

        modalTitle.textContent = modalName;
      }
    });
  }
});

$("#event-datepicker").datepicker({
  format: "dd-mm-yyyy",
  weekStart: 1,
  startDate: 0,
  maxViewMode: 2,
  todayBtn: "linked",
  calendarWeeks: true,
  todayHighlight: true,
});
