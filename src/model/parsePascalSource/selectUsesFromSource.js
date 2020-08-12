function selectUsesFromSource(source) {
   const regex = /uses\s*(\w*\.\w*|\w*|\s|\,)*;/gi;
   const listUses = source
      .match(regex)[0]
      .replace(/(uses|;|\s)/gi, '')
      .split(',');

   return listUses;
}

module.exports = selectUsesFromSource;