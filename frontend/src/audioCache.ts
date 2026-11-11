/** Reuse each full download for audio playback and beat analysis. Failed loads can retry. */
export function createAudioCache(
    fetchBlob = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw Error(`Audio unavailable: ${response.status}`);
        return response.blob();
    },
    createSource = (blob: Blob) => URL.createObjectURL(blob),
) {
    const downloads = new Map<string, Promise<Blob>>();
    const sources = new Map<string, Promise<string>>();
    const audioBytes = (url: string): Promise<Blob> => {
        let pending = downloads.get(url);
        if (!pending) {
            pending = fetchBlob(url).catch((error) => {
                downloads.delete(url);
                throw error;
            });
            downloads.set(url, pending);
        }
        return pending;
    };
    const audioSource = (url: string): Promise<string> => {
        let pending = sources.get(url);
        if (!pending) {
            pending = audioBytes(url)
                .then(createSource)
                .catch((error) => {
                    sources.delete(url);
                    throw error;
                });
            sources.set(url, pending);
        }
        return pending;
    };
    return { audioBytes, audioSource };
}
