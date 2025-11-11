import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Reservation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const reservationSchema = {
    type: Type.OBJECT,
    properties: {
        bookingNumber: { type: Type.STRING },
        guestName: { type: Type.STRING },
        checkInDate: { type: Type.STRING, description: "Format DD.MM.YYYY" },
        checkOutDate: { type: Type.STRING, description: "Format DD.MM.YYYY" },
        grossAmount: { type: Type.NUMBER },
        bookingCommission: { type: Type.NUMBER },
        transactionFee: { type: Type.NUMBER },
    },
    required: ['bookingNumber', 'guestName', 'checkInDate', 'checkOutDate', 'grossAmount', 'bookingCommission', 'transactionFee']
};

export const extractDataFromFile = async (base64Data: string, mimeType: string): Promise<Reservation[]> => {
    const filePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `Analyze the provided document (image or PDF) of a Booking.com payout overview. Extract all reservation entries from the table. 
The table columns are: 'Br. rezervacije', 'Ime gosta', 'Prijava', 'Odjava', 'Iznos', 'Provizija', 'Naknada za transakciju'.
Map them to the JSON fields according to the schema.
All monetary values should be numbers, using a period as the decimal separator and ignoring currency symbols. 
Dates must be in 'DD.MM.YYYY' format.
Return a JSON array of objects. Do not return markdown code block fences.`
    };
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: reservationSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return data as Reservation[];

    } catch (error) {
        console.error("Error extracting data from file:", error);
        throw new Error("Gemini API call for data extraction failed.");
    }
};

export const generateFinancialAnalysis = async (reservations: Reservation[]): Promise<string> => {
    const prompt = `
# Uloga i Cilj Aplikacije
Ti si Booking.com Financijski Analizator. Tvoja je primarna funkcija da nakon obrade priloženog JSON-a sa podacima o rezervacijama generiraš detaljnu financijsku analizu.

# VAŽNO
*   Izlaz mora biti formatiran kao **Markdown** tekst.
*   Koristi hrvatski jezik.
*   Analiza se odnosi na mjesec **listopad 2025**.

# Podaci o Rezervacijama
Ovo su podaci o 38 rezervacija izvađeni iz dokumenta:
\`\`\`json
${JSON.stringify(reservations, null, 2)}
\`\`\`

# Zahtjev za Financijskom Analizom (GLAVNI IZLAZ)
Kao glavni izlaz, prikaži detaljan financijski izvještaj u strukturiranom, čitljivom Markdown formatu, koji mora sadržavati:

1.  **Pregled Troškova i Prihoda (Listopad 2025.):**
    *   Ukupan Bruto Prihod (Zbroj \`grossAmount\`).
    *   Ukupna Provizija Booking.com (izražena u € i kao % Bruto Prihoda).
    *   Ukupna Naknada za Transakciju (izražena u € i kao % Bruto Prihoda).
    *   Ukupni Troškovi Posredovanja (Provizija + Naknada).
    *   Ukupan Neto Prihod (Iznos za Isplatu).
    *   Prikaži ove podatke u Markdown tabeli.

2.  **Ključni Pokazatelji Učinka (KPI):**
    *   Ukupan broj rezervacija (38).
    *   Ukupan broj ostvarenih noćenja (Izračunaj zbrojem razlike datuma za svaku rezervaciju).
    *   Prosječna Dnevna Cijena (ADR = Ukupan Bruto Prihod / Ukupan broj noćenja).
    *   Prosječna Duljina Boravka (LOS = Ukupan broj noćenja / Ukupan broj rezervacija).
    *   Prikaži ove podatke kao listu.

3.  **Optimizacija i Preporuke:**
    *   Napiši detaljnu uputu (nekoliko odlomaka) s **konkretnim, primjenjivim koracima** za optimizaciju prihoda.
    *   Fokusiraj se na sljedeće strategije:
        *   **Smanjenje Troškova Posredovanja:** Daj specifične savjete kako smanjiti troškove. Posebno se osvrni na **naknade za transakciju** - istraži i objasni postoje li alternativni načini plaćanja ili postavke na Booking.com koje mogu umanjiti ovaj trošak.
        *   **Povećanje Direktnih Rezervacija:** Predloži konkretne akcije za poticanje gostiju na direktnu rezervaciju pri sljedećem posjetu (npr. vizitke s popustom u sobi, prikupljanje email adresa za slanje ponuda, program vjernosti).
        *   **Povećanje Duljine Boravka (LOS):** Navedi strategije za poticanje dužih boravaka (npr. popusti za duži boravak, tjedni paketi, posebne ponude za boravke od 5+ noći).
        *   **Korištenje Genius Programa:** Objasni prednosti i mane Booking.com Genius programa. Daj savjete kako ga pametno iskoristiti za ciljanje kvalitetnijih gostiju, povećanje vidljivosti i potencijalno povećanje prosječne dnevne cijene (ADR) unatoč popustima koje program nudi.
    *   Preporuke moraju biti praktične i lako primjenjive za malog iznajmljivača.
`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating financial analysis:", error);
        throw new Error("Gemini API call for financial analysis failed.");
    }
};