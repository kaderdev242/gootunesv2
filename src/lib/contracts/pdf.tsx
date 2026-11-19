import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Contract } from "./template";

export type PdfSignature = {
  signerName: string;
  signaturePng: string;
  signedAt: string;
  contentHash: string;
  ip: string | null;
};

const s = StyleSheet.create({
  // Pas d'interligne au niveau de la page : il masque les textes calculés (numéro de page).
  page: { paddingTop: 54, paddingBottom: 64, paddingHorizontal: 56, fontFamily: "Helvetica", fontSize: 10, color: "#1c1c1e" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 1 },
  version: { fontSize: 8.5, color: "#6e6e73", marginTop: 2 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 18, marginTop: 22, lineHeight: 1.25 },
  partiesRow: { flexDirection: "row", gap: 14, marginTop: 18 },
  partyBox: { flex: 1, borderWidth: 0.75, borderColor: "#d2d2d7", borderRadius: 6, padding: 10 },
  partyTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#6e6e73", marginBottom: 4 },
  partyLine: { fontSize: 9.5, lineHeight: "14pt" },
  article: { marginTop: 14 },
  articleTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 3 },
  paragraph: { marginTop: 3, textAlign: "justify", fontSize: 10, lineHeight: "15pt" },
  signBlock: { marginTop: 24, borderTopWidth: 0.75, borderTopColor: "#d2d2d7", paddingTop: 14 },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  signImage: { width: 200, height: 70, objectFit: "contain", marginTop: 8 },
  signLine: { width: 220, borderBottomWidth: 0.75, borderBottomColor: "#1c1c1e", height: 60, marginTop: 8 },
  meta: { fontSize: 8, color: "#6e6e73", marginTop: 2 },
  footerLeft: { position: "absolute", bottom: 28, left: 56, fontSize: 8, color: "#86868b" },
  footerRight: { position: "absolute", bottom: 28, left: 56, right: 56, textAlign: "right", fontSize: 8, color: "#86868b" },
});

/** Helvetica (WinAnsi) ne connaît pas l'espace fine insécable. */
function t(text: string) {
  return text.replace(/ /g, " ");
}

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

function ContractPdf({ contract, signature }: { contract: Contract; signature: PdfSignature | null }) {
  return (
    <Document title={contract.title} author="Gootunes" subject={contract.versionLabel} language="fr">
      <Page size="A4" style={s.page}>
        <Text style={s.footerLeft} fixed>
          {`Gootunes · ${contract.versionLabel}`}
        </Text>
        <Text style={s.footerRight} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        <Text style={s.brand}>GOOTUNES</Text>
        <Text style={s.version}>{contract.versionLabel}</Text>
        <Text style={s.title}>{t(contract.title)}</Text>

        <View style={s.partiesRow}>
          {[contract.platform, contract.creator].map((party) => (
            <View key={party.title} style={s.partyBox} wrap={false}>
              <Text style={s.partyTitle}>{party.title}</Text>
              {party.lines.map((line) => (
                <Text key={line} style={s.partyLine}>
                  {t(line)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {contract.articles.map((article, i) => (
          <View key={article.title} style={s.article}>
            {/* Le titre ne reste jamais seul en bas de page : il suit son premier paragraphe. */}
            <View wrap={false}>
              <Text style={s.articleTitle}>{`Article ${i + 1} — ${t(article.title)}`}</Text>
              <Text style={s.paragraph}>{t(article.paragraphs[0] ?? "")}</Text>
            </View>
            {article.paragraphs.slice(1).map((p) => (
              <Text key={p} style={s.paragraph}>
                {t(p)}
              </Text>
            ))}
          </View>
        ))}

        <View style={s.signBlock} wrap={false}>
          <Text style={s.signTitle}>Signature {contract.role === "label" ? "du Label" : "de l'Artiste"}</Text>
          {signature ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={signature.signaturePng} style={s.signImage} />
              <Text>{t(signature.signerName)}</Text>
              <Text style={s.meta}>Signé électroniquement le {dateTimeFmt.format(new Date(signature.signedAt))} (UTC)</Text>
              {signature.ip ? <Text style={s.meta}>Adresse IP : {signature.ip}</Text> : null}
              <Text style={s.meta}>Empreinte SHA-256 du texte signé : {signature.contentHash}</Text>
            </>
          ) : (
            <>
              <View style={s.signLine} />
              <Text style={s.meta}>Nom, date et signature — la signature se fait électroniquement depuis l&apos;espace Gootunes.</Text>
            </>
          )}
        </View>

      </Page>
    </Document>
  );
}

export async function renderContractPdf(contract: Contract, signature: PdfSignature | null): Promise<Buffer> {
  return renderToBuffer(<ContractPdf contract={contract} signature={signature} />);
}

export function pdfResponse(buffer: Buffer, filename: string, disposition: "attachment" | "inline" = "attachment") {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
