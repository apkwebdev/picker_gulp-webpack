'use strict';
import $ from 'jquery';

export default function() {
  $('#zooming').on('click', function() { 
    $('body').toggleClass('zoom-in'); 
    $('body').find('*').toggleClass('zoom-in');
  });
};