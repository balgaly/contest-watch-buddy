// constants.js
export const ADMIN_PASSWORD = "melody2025";

export const CRITERIA = [
    { id: "songQuality", label: "Song Quality", weight: 0.4, description: "How good is the composition, melody, and lyrics of the song" },
    { id: "staging", label: "Staging", weight: 0.25, description: "How interesting and amazing the visual presentation is on stage" },
    { id: "vocalQuality", label: "Vocal Quality", weight: 0.35, description: "How talented and skilled the performer is vocally" }
];

export const initialContests = [
    {
        id: "melo2025",
        name: "Melodifestivalen 2025",
        contestants: [
            { id: 1, name: "John Lundvik – 'Voice of the Silent'" },
            { id: 2, name: "Dolly Style – 'Yihaa'" },
            { id: 3, name: "Greczula – 'Believe Me'" },
            { id: 4, name: "Klara Hammarström – 'On and On and On'" },
            { id: 5, name: "Scarlet – 'Sweet N' Psycho'" },
            { id: 6, name: "Erika Segerstedt – 'Show Me What love Is'" },
            { id: 7, name: "Maja Ivarsoon – 'Kamikaze Life'" },
            { id: 8, name: "Meira Omar – 'Hush Hush'" },
            { id: 9, name: "Måns Zelmerlöw – 'Revolution'" },
            { id: 10, name: "Saga Ludvigsson – 'Hate You So Much'" },
            { id: 11, name: "Annika Wickihalder – 'Life Again'" },
            { id: 12, name: "Kaj – 'Bara bada bastu'" }
        ]
    },
    {
        id: "euro2025",
        name: "Eurovision 2025",
        contestants: [
            { id: 1, name: "Sweden" },
            { id: 2, name: "United Kingdom" },
            { id: 3, name: "France" },
            { id: 4, name: "Germany" },
            { id: 5, name: "Italy" }
        ]
    }
];
