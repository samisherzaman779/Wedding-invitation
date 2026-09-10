/* ======================================================================
   CENTRAL WEDDING CONFIGURATION — edit this block for the real details
   ====================================================================== */
export const wedding = {
  couple: { bride: "Muqaddas", groom: "Sami" }, // display order used: groom & bride
  weddingDate: "2027-02-20T20:00:00+05:00", // Nikah day — countdown target
  city: "Karachi, Pakistan",
  language: "en",
  showBismillah: true,

  venue: {
    name: "Venue name — to be confirmed",
    address: "Karachi, Pakistan",
    mapsQuery: "Karachi Pakistan"
  },

  events: [
    { id: "mehndi", name: "Mehndi", date: "Friday, 19 February 2027", time: "7:00 PM", venue: "Venue — TBC, Karachi", dressCode: "Traditional / Festive", description: "An evening of colour, music and mehndi — come dressed to dance.", mapsQuery: "Karachi Pakistan" },
    { id: "nikah", name: "Nikah", date: "Saturday, 20 February 2027", time: "8:00 PM", venue: "Venue — TBC, Karachi", dressCode: "Formal / Traditional", description: "The Nikah ceremony, followed by dinner and celebration.", mapsQuery: "Karachi Pakistan" },
    { id: "walima", name: "Walima", date: "Sunday, 21 February 2027", time: "8:00 PM", venue: "Venue — TBC, Karachi", dressCode: "Elegant Formal", description: "A quiet, elegant close to the celebrations, hosted by the groom's family.", mapsQuery: "Karachi Pakistan" }
  ],

  story: [
    { year: "2019", title: "A beautiful beginning", text: "Two families, one introduction, and a conversation that lasted long past dinner.", location: "Karachi" },
    { year: "2022", title: "The journey continued", text: "Years of long calls, shared plans, and knowing there was no one else quite like this.", location: "" },
    { year: "2026", title: "A new chapter began", text: "A quiet proposal, a loud celebration, and a date finally set.", location: "Karachi" },
    { year: "2027", title: "Forever begins", text: "And now, the wedding — with all of you there to see it.", location: "" }
  ],

  // Placeholder photography — replace each url with Sami & Muqaddas's real photos before sending
  gallery: [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800", alt: "Placeholder couple portrait" },
    { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800", alt: "Placeholder mehndi detail" },
    { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800", alt: "Placeholder engagement photo" },
    { url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=800", alt: "Placeholder bridal jewelry" },
    { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800", alt: "Placeholder couple walking" },
    { url: "https://images.unsplash.com/photo-1550005809-91ad75fb315f?q=80&w=800", alt: "Placeholder floral decor" }
  ],

  dressCode: [
    { event: "Mehndi", code: "Traditional / Festive" },
    { event: "Nikah", code: "Formal / Traditional" },
    { event: "Walima", code: "Elegant Formal" }
  ],

  family: { bride: "Muqaddas's family, Karachi", groom: "Sami's family, Karachi" },
  music: "/wedding-music-placeholder.mp3",
  rsvpDeadline: "1 February 2027"
};
