﻿$.fn.checked=function(value){if(value===true||value===false){return $(this).each(function(){this.checked=value;});}else{return this.length&&this[0].checked;}};