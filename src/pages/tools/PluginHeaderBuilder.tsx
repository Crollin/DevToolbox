import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PluginHeaderBuilder = () => {
  const tool = tools.find((t) => t.id === "plugin-header-builder")!;
  const [name, setName] = useState("Mon Plugin");
  const [uri, setUri] = useState("https://example.com/mon-plugin");
  const [description, setDescription] = useState("Description courte du plugin.");
  const [version, setVersion] = useState("1.0.0");
  const [author, setAuthor] = useState("Votre Nom");
  const [authorUri, setAuthorUri] = useState("https://example.com");
  const [textDomain, setTextDomain] = useState("mon-plugin");
  const [requiresWp, setRequiresWp] = useState("6.0");
  const [requiresPhp, setRequiresPhp] = useState("7.4");
  const [copied, setCopied] = useState(false);

  const header = useMemo(
    () => `<?php
/**
 * Plugin Name:       ${name}
 * Plugin URI:        ${uri}
 * Description:       ${description}
 * Version:           ${version}
 * Requires at least: ${requiresWp}
 * Requires PHP:      ${requiresPhp}
 * Author:            ${author}
 * Author URI:        ${authorUri}
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ${textDomain}
 *
 * @package ${textDomain.replace(/-/g, "_")}
 */
`,
    [name, uri, description, version, author, authorUri, textDomain, requiresWp, requiresPhp]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(header);
    setCopied(true);
    toast({ title: "En-tête copié" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métadonnées plugin WordPress.org</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nom du plugin</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plugin URI</Label>
              <Input value={uri} onChange={(e) => setUri(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Text Domain</Label>
                <Input value={textDomain} onChange={(e) => setTextDomain(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Requires WP</Label>
                <Input value={requiresWp} onChange={(e) => setRequiresWp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Requires PHP</Label>
                <Input value={requiresPhp} onChange={(e) => setRequiresPhp(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Auteur</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Author URI</Label>
              <Input value={authorUri} onChange={(e) => setAuthorUri(e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>En-tête PHP</Label>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Textarea value={header} readOnly className="font-mono text-sm min-h-[400px]" />
        </div>
      </div>
    </ToolLayout>
  );
};

export default PluginHeaderBuilder;
