//Handle Scrape button
$("#scrape").on("click", function() {
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).done(function(data) {
    console.log(data);
    window.location = "/";
  });
});

//Set click nav option to active
$(".navbar-nav li").click(function() {
  $(".navbar-nav li").removeClass("active");
  $(this).addClass("active");
});

//Store Article button
$(".store").on("click", function() {
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "POST",
    url: "/articles/stored/" + thisId
  }).done(function(data) {
    window.location = "/";
  });
});

//Remove Article button
$(".remove").on("click", function() {
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "POST",
    url: "/articles/delete/" + thisId
  }).done(function(data) {
    window.location = "/saved";
  });
});

//Store Note button
$(".storeNote").on("click", function() {
  var thisId = $(this).attr("data-id");
  if (!$("#noteText" + thisId).val()) {
    alert("enter note");
  } else {
    $.ajax({
      method: "POST",
      url: "/notes/stored/" + thisId,
      data: {
        text: $("#noteText" + thisId).val()
      }
    }).done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#noteText" + thisId).val("");
      $(".modalNote").modal("hide");
      window.location = "/saved";
    });
  }
});

//Remove Note button
$(".removeNote").on("click", function() {
  var noteId = $(this).attr("data-note-id");
  var articleId = $(this).attr("data-article-id");
  $.ajax({
    method: "DELETE",
    url: "/notes/remove/" + noteId + "/" + articleId
  }).done(function(data) {
    console.log(data);
    $(".modalNote").modal("hide");
    window.location = "/stored";
  });
});
