import { resolveUploadUrl } from '../api/axiosClient';

const SIZE_CLASS = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl' };
const SIZE_PX = { sm: 32, md: 40, lg: 56, xl: 80 };

export default function Avatar({ username, src, size = 'md' }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const pixelSize = SIZE_PX[size] || SIZE_PX.md;
  const initials = (username || '?').slice(0, 2).toUpperCase();
  const resolvedSrc = resolveUploadUrl(src);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={username ? `${username}'s avatar` : 'Avatar'}
        className={sizeClass}
        style={{ objectFit: 'cover', borderRadius: 'var(--radius-full)', flexShrink: 0, width: pixelSize, height: pixelSize }}
      />
    );
  }

  return <div className={`avatar ${sizeClass}`}>{initials}</div>;
}
