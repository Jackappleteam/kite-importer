import { parseBotGhostExport } from "@/lib/botghost/parse";
import { convertBotGhostItems } from "@/lib/botghost/convert";
import { parseInventorExport } from "@/lib/inventor/parse";
import { convertInventorItems } from "@/lib/inventor/convert";

// Turns what the bookmark read into Kite flows.
export function convert(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const obj = typeof data === "string" ? JSON.parse(data) : (data as any);
  const items: any[] =
    obj && obj.kite_inventor_export
      ? convertInventorItems(parseInventorExport(text))
      : (() => {
          const p = parseBotGhostExport(text);
          return convertBotGhostItems([...p.commands, ...p.events]);
        })();
  return items.map((i) => ({
    kind: i.kind,
    name: i.name,
    status: i.status,
    notes: i.notes as string[],
    json: i.flow
      ? JSON.stringify({ flow_source: i.flow, enabled: true }, null, 2)
      : null,
  }));
}
