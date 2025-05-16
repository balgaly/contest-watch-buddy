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
    },
    {
        id: "euro2025sf1",
        name: "Eurovision 2025 Semi Final 1",
        contestants: [
            { id: 1, name: "VÆB – RÓA", country: "Iceland" },
            { id: 2, name: "Justyna Steczkowska – GAJA", country: "Poland" },
            { id: 3, name: "Klemen – How Much Time Do We Have Left", country: "Slovenia" },
            { id: 4, name: "Tommy Cash – Espresso Macchiato", country: "Estonia" },
            { id: 5, name: "Ziferblat – Bird of Pray", country: "Ukraine" },
            { id: 6, name: "KAJ – Bara Bada Bastu", country: "Sweden" },
            { id: 7, name: "NAPA – Deslocado", country: "Portugal" },
            { id: 8, name: "Kyle Alessandro – Lighter", country: "Norway" },
            { id: 9, name: "Red Sebastian – Strobe Lights", country: "Belgium" },
            { id: 10, name: "Mamagama – Run With U", country: "Azerbaijan" },
            { id: 11, name: "Gabry Ponte – Tutta L’Italia", country: "San Marino" },
            { id: 12, name: "Shkodra Elektronike – Zjerm", country: "Albania" },
            { id: 13, name: "Claude – C’est La Vie", country: "Netherlands" },
            { id: 14, name: "Marko Bošnjak – Poison Cake", country: "Croatia" },
            { id: 15, name: "Theo Evan – Shh", country: "Cyprus" }
        ]
    },
    {
        id: "euro2025final",
        name: "Eurovision 2025",
        contestants: [
            { id: 1, order: 1, country: "Norway", name: "Kyle Alessandro – Lighter" },
            { id: 2, order: 2, country: "Luxembourg", name: "Laura Thorn – La Poupée Monte Le Son" },
            { id: 3, order: 3, country: "Estonia", name: "Tommy Cash – Espresso Macchiato" },
            { id: 4, order: 4, country: "Israel", name: "Yuval Raphael – New Day Will Rise" },
            { id: 5, order: 5, country: "Lithuania", name: "Katarsis – Tavo Akys" },
            { id: 6, order: 6, country: "Spain", name: "Melody – Esa Diva" },
            { id: 7, order: 7, country: "Ukraine", name: "Ziferblat – Bird of Pray" },
            { id: 8, order: 8, country: "United Kingdom", name: "Remember Monday – What The Hell Just Happened?" },
            { id: 9, order: 9, country: "Austria", name: "JJ – Wasted Love" },
            { id: 10, order: 10, country: "Iceland", name: "VÆB – RÓA" },
            { id: 11, order: 11, country: "Latvia", name: "Tautumeitas – Bur Man Laimi" },
            { id: 12, order: 12, country: "Netherlands", name: "Claude – C’est La Vie" },
            { id: 13, order: 13, country: "Finland", name: "Erika Vikman – Ich Komme" },
            { id: 14, order: 14, country: "Italy", name: "Lucio Corsi – Volevo Essere un Duro" },
            { id: 15, order: 15, country: "Poland", name: "Justyna Steczkowska – Gaja" },
            { id: 16, order: 16, country: "Germany", name: "Abor & Tynna – Baller" },
            { id: 17, order: 17, country: "Greece", name: "Klavdia – Asteromata" },
            { id: 18, order: 18, country: "Armenia", name: "Parg – Survivor" },
            { id: 19, order: 19, country: "Switzerland", name: "Zoë Më – Voyage" },
            { id: 20, order: 20, country: "Malta", name: "Miriana Conte – Serving" },
            { id: 21, order: 21, country: "Portugal", name: "Napa – Deslocado" },
            { id: 22, order: 22, country: "Denmark", name: "Sissal – Hallucination" },
            { id: 23, order: 23, country: "Sweden", name: "KAJ – Bara Bada Bastu" },
            { id: 24, order: 24, country: "France", name: "Louane – Maman" },
            { id: 25, order: 25, country: "San Marino", name: "Gabry Ponte – Tutta l’Italia" },
            { id: 26, order: 26, country: "Albania", name: "Shkodra Elektronike – Zjerm" }
        ]
    }
];
