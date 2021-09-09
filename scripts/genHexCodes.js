new Array(Number(process.env.NUM_HEX_CODES))
  .fill(null)
  .map(() =>
    new Array(6).fill(null).map(
      () =>
        `#${Math.floor(Math.random() * 16 ** 6)
          .toString(16)
          .padStart(6, '0')
          .toUpperCase()}`,
    ),
  )
  .forEach((hexs) => {
    hexs.forEach((hex) => {
      console.log(hex);
    });
  });
