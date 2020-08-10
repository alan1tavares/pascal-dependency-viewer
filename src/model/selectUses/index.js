const fs = require('fs');

function selectUses(source) {
   const regex = /uses\s*(\w*\.\w*|\w*|\s|\,)*;/gi;
   const matchUses = source.match(regex)[0];
   return matchUses.replace(/(uses|;|\s)/gi, '');
}

module.exports = selectUses;