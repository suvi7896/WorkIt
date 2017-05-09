 $(document).ready(function(){
    $('ul.tabs').tabs();
  });


  $('#textarea1').val('New Text');
  $('#textarea1').trigger('autoresize');

  $(document).ready(function(){
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('#modal1').modal();
  });
          

  $(document).ready(function(){
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('#modal2').modal();
  });
          
          $(document).ready(function(){
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('.modal3').modal();
  });
          