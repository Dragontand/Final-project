import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return; // Only run if the page has a calendar

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: {
    left: 'prev,next today addEventbutton',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek,timeGridDay'
    },
    customButtons: {
      addEventbutton: {
        //icon: 'custom-icon-class',  Then style it in CSS
        text: '+ Event',
        click: function () {}
      }
    },
    events: '/events',
    eventTimeFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    },
    slotLabelFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    }
  });

  calendar.render();

  // Add Bootstrap modal attributes to the custom button
  const btn = document.querySelector('.fc-addEventbutton-button');
  if (btn) {
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#modal');
    btn.setAttribute('data-bs-name', 'New Event');
  }

  // Handles modal content updates
  const Modal = document.getElementById('modal');
  if (Modal) {
    Modal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      if (button) {
        const modalName = button.getAttribute('data-bs-name');

        const modalTitle = Modal.querySelector('.modal-title');

        modalTitle.textContent = modalName;
      }
    });
  }
});

$('#event-datepicker').datepicker({
    format: "dd/mm/yy",
    weekStart: 1,
    startDate: 0,
    maxViewMode: 2,
    todayBtn: "linked",
    calendarWeeks: true,
    todayHighlight: true
});