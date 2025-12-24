export const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
};

export const getSongUrl = (song) => {
    if (!song) return '';
    const id = song.songId || song.id;
    const slug = slugify(song.title);
    return `/song/${id}${slug ? '-' + slug : ''}`;
};

export const getAlbumUrl = (album) => {
    if (!album) return '';
    const id = album.albumId || album.id;
    const slug = slugify(album.title);
    return `/album/${id}${slug ? '-' + slug : ''}`;
};

export const getUserUrl = (user) => {
    if (!user) return '';
    const rawUsername = user.username || user.artistUsername || user.coverArtistUsername;
    const username = rawUsername?.startsWith('@') ? rawUsername.substring(1) : rawUsername;
    if (username) return `/@${username}`;
    const id = user.userId || user.id;
    return `/user/${id}`;
};
