import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { tools } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WPConfigGenerator = () => {
  const tool = tools.find((t) => t.id === "wp-config-generator")!;
  const [debug, setDebug] = useState(false);
  const [debugLog, setDebugLog] = useState(false);
  const [debugDisplay, setDebugDisplay] = useState(false);
  const [redis, setRedis] = useState(false);
  const [multisite, setMultisite] = useState(false);
  const [redisHost, setRedisHost] = useState("127.0.0.1");
  const [tablePrefix, setTablePrefix] = useState("wp_");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const lines: string[] = [];
    if (debug) {
      lines.push("define( 'WP_DEBUG', true );");
      if (debugLog) lines.push("define( 'WP_DEBUG_LOG', true );");
      if (debugDisplay) lines.push("define( 'WP_DEBUG_DISPLAY', false );");
    }
    if (redis) {
      lines.push(`define( 'WP_REDIS_HOST', '${redisHost}' );`);
      lines.push("define( 'WP_CACHE_KEY_SALT', '" + tablePrefix + "' );");
    }
    if (multisite) {
      lines.push("define( 'WP_ALLOW_MULTISITE', true );");
    }
    lines.push(`$table_prefix = '${tablePrefix}';`);
    lines.push("");
    lines.push("/* Salts — générez sur https://api.wordpress.org/secret-key/1.1/salt/ */");
    return lines.join("\n");
  }, [debug, debugLog, debugDisplay, redis, redisHost, multisite, tablePrefix]);

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copié dans le presse-papiers" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options wp-config.php</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>WP_DEBUG</Label>
              <Switch checked={debug} onCheckedChange={setDebug} />
            </div>
            {debug && (
              <>
                <div className="flex items-center justify-between">
                  <Label>WP_DEBUG_LOG</Label>
                  <Switch checked={debugLog} onCheckedChange={setDebugLog} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>WP_DEBUG_DISPLAY</Label>
                  <Switch checked={debugDisplay} onCheckedChange={setDebugDisplay} />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <Label>Redis object cache</Label>
              <Switch checked={redis} onCheckedChange={setRedis} />
            </div>
            {redis && (
              <div className="space-y-2">
                <Label>Hôte Redis</Label>
                <Input value={redisHost} onChange={(e) => setRedisHost(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Multisite</Label>
              <Switch checked={multisite} onCheckedChange={setMultisite} />
            </div>
            <div className="space-y-2">
              <Label>Préfixe tables</Label>
              <Input value={tablePrefix} onChange={(e) => setTablePrefix(e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Code généré</Label>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Textarea value={output} readOnly className="font-mono text-sm min-h-[320px]" />
        </div>
      </div>
    </ToolLayout>
  );
};

export default WPConfigGenerator;
