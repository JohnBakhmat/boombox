# Cover Art fetching

1. Cover art parsing should not block main parsing flow
2. When we see that album doesn't have a coverart:
    1. Fetch cover art from musicbrainz api
        1. look for RELEASE_GROUP_ID or whatever and try fetching it from the endpoint
        2. Determine what rate limits there are
    
    2. Try parsing cover art from one of the song files inside of the album

3. Benchmark readDirectory. Key metrics are:
    1. Speed
    2. Memory spikes (graph)
    3. Highest memory usage
4. Benchmark readDirectory implementation using streams
