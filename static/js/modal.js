document.addEventListener("DOMContentLoaded", () => {
    // Activate editTitle onclick
    const titleSpan = document.getElementById('modal-title');
    titleSpan.addEventListener("click", editTitle);
    // Activate saveTitle onblur
    const titleInput = document.getElementById("modal-title-input");
    titleInput.value = "New Event"; // Default value
    titleInput.addEventListener("blur", saveTitle);

    // Save on Enter key
    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // prevent form submission
            titleInput.blur();       // triggers saveTitle via onblur
        }
    });

    const modalEl = document.getElementById('modal');
    // This runs every time the modal is about to hide
    modalEl.addEventListener('hide.bs.modal', () => {
        const focused = document.activeElement;
        // Check if the focused element is inside the modal
        if (modalEl.contains(focused)) {
            focused.blur(); // remove focus
        }
    });
});

function editTitle() {
    const span = document.getElementById('modal-title');
    const input = document.getElementById('modal-title-input');
    
    input.value = span.textContent;
    span.style.display = 'none';
    input.style.display = 'inline-block';
    input.focus();
    input.select(); // select all text
}

function saveTitle() {
    const span = document.getElementById('modal-title');
    const input = document.getElementById('modal-title-input');
    const newText = input.value.trim();
    span.textContent = newText;
    if (newText === "") {
        input.placeholder = "Title is required";
        input.classList.add('is-invalid');
        return;
    }
    input.classList.remove('is-invalid');
    input.style.display = 'none';
    span.style.display = 'inline';
}
