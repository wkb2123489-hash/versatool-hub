export const getEmbedParams = () => {
  if (typeof window === 'undefined') {
    return {
      isEmbed: false,
      isCompactEmbed: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed');
  const compact = params.get('compact');

  const isEmbed =
    embed === 'true' ||
    embed === '1';

  const isCompactEmbed =
    isEmbed &&
    !!compact &&
    (compact === 'true' || compact === '1');

  return {
    isEmbed,
    isCompactEmbed,
  };
};

export const isEmbed = () => getEmbedParams().isEmbed;

export const isCompactEmbed = () => getEmbedParams().isCompactEmbed;

