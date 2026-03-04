const CARD_GALLERY_PATH = "/card-gallery";

function redirectToSearch() {
  let searchInput = $(".searchInput").val();
  if (!searchInput) {
    window.location.href = CARD_GALLERY_PATH;
    return;
  }
  window.location.href = CARD_GALLERY_PATH + "?q=" + encodeURIComponent(searchInput);
}
