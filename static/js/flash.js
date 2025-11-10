export function showFlash(category, message) {
  const $flashEl = $("#flash");
  if ($flashEl.length === 0) {
    console.error("HTTP error: 404 could not find flash element!");
    return;
  }
  $flashEl.stop(true, true).show();
  // Make the alert el
  // Use backticks for correct spacing in HTML
  const $alert = $(`
    <div class="alert alert-${category} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `);

  $flashEl.append($alert);

  // Fade out only this specific alert after 3 seconds
  $alert.delay(3000).fadeOut("slow", function() {
    // Remove from the DOM for cleane deletion
    $(this).remove();
  });
}
