function getUnitName(source) {
   const regex = /unit.*;/i;
   const unitName = source
      .match(regex)[0]
      .replace(/(unit |;|\s)/gi, '');

   return unitName;
}

module.exports = getUnitName;