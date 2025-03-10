export const FAKE_PLACES = [
  { name: "La Bella Vita", type: "restaurant", address: "123 Main St, Rome", language: "Italian" },
  { name: "Le Petit Bistro", type: "restaurant", address: "45 Rue de Paris, France", language: "French" },
  { name: "Café Milano", type: "cafe", address: "678 Via Milano, Italy", language: "Italian" },
  { name: "Dolce Espresso", type: "cafe", address: "22 Piazza Navona, Italy", language: "Italian" },
  { name: "El Toro Bar", type: "bar", address: "11 Plaza Mayor, Spain", language: "Spanish" },
  { name: "Tapas y Vino", type: "bar", address: "98 Rambla Street, Barcelona", language: "Spanish" },
];

export const SAMPLE_DATA = {
  restaurant: {
    Italian: {
      topItems: [
        { name: "Spaghetti Carbonara", pronunciation: "spah-GEH-tee kar-boh-NAH-rah", image: "/images/carbonara.jpg" },
        { name: "Pizza Margherita", pronunciation: "PEET-sah mar-geh-REE-tah", image: "/images/pizza.jpg" },
        { name: "Osso Buco", pronunciation: "OH-soh BOO-koh", image: "/images/ossobuco.jpg" },
      ],
      dialogs: [
        {
          prompt: "Réserver une table",
          messages: [
            { speaker: "tourist", text: "Vorrei prenotare un tavolo per due.", translation: "I would like to reserve a table for two." },
            { speaker: "staff", text: "Per quale ora?", translation: "For what time?" },
            { speaker: "tourist", text: "Per le otto di sera.", translation: "For eight in the evening." },
          ],
        },
      ],
    },
    French: {
      topItems: [
        { name: "Coq au Vin", pronunciation: "kohk oh VAN", image: "/images/coqauvin.jpg" },
        { name: "Bouillabaisse", pronunciation: "boo-yah-BESS", image: "/images/bouillabaisse.jpg" },
        { name: "Ratatouille", pronunciation: "ra-ta-TOO-ee", image: "/images/ratatouille.jpg" },
      ],
      dialogs: [
        {
          prompt: "Commander du vin",
          messages: [
            { speaker: "tourist", text: "Je voudrais une bouteille de vin rouge.", translation: "I would like a bottle of red wine." },
            { speaker: "staff", text: "Préférez-vous un Bordeaux ou un Bourgogne?", translation: "Do you prefer a Bordeaux or a Burgundy?" },
          ],
        },
      ],
    },
  },
  cafe: {
    Italian: {
      topItems: [
        { name: "Cappuccino", pronunciation: "kap-poo-CHEE-noh", image: "/images/cappuccino.jpg" },
        { name: "Espresso", pronunciation: "eh-SPRES-soh", image: "/images/espresso.jpg" },
        { name: "Cornetto", pronunciation: "kohr-NET-toh", image: "/images/cornetto.jpg" },
      ],
      dialogs: [
        {
          prompt: "Commander un café",
          messages: [
            { speaker: "tourist", text: "Un cappuccino, per favore.", translation: "A cappuccino, please." },
            { speaker: "staff", text: "Lo vuole con latte caldo o freddo?", translation: "Would you like it with hot or cold milk?" },
          ],
        },
      ],
    },
  },
  bar: {
    Spanish: {
      topItems: [
        { name: "Sangría", pronunciation: "san-GREE-ah", image: "/images/sangria.jpg" },
        { name: "Tapas", pronunciation: "TAH-pahs", image: "/images/tapas.jpg" },
        { name: "Paella", pronunciation: "pah-EH-yah", image: "/images/paella.jpg" },
      ],
      dialogs: [
        {
          prompt: "Commander une boisson",
          messages: [
            { speaker: "tourist", text: "Una sangría, por favor.", translation: "One sangria, please." },
            { speaker: "staff", text: "¿Grande o pequeña?", translation: "Large or small?" },
          ],
        },
      ],
    },
  },
}; 