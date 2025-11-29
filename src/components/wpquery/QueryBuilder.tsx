import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { WPQueryConfig, MetaQuery, TaxQuery, defaultPostTypes, defaultPostStatuses, orderByOptions, metaCompareOptions, metaTypeOptions, taxOperatorOptions, taxFieldOptions } from "@/types/wpquery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface QueryBuilderProps {
  config: WPQueryConfig;
  onChange: (config: WPQueryConfig) => void;
}

const QueryBuilder = ({ config, onChange }: QueryBuilderProps) => {
  const updateConfig = (updates: Partial<WPQueryConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addPostType = (type: string) => {
    const current = config.post_type || [];
    if (!current.includes(type)) {
      updateConfig({ post_type: [...current, type] });
    }
  };

  const removePostType = (type: string) => {
    const current = config.post_type || [];
    updateConfig({ post_type: current.filter((t) => t !== type) });
  };

  const addPostStatus = (status: string) => {
    const current = config.post_status || [];
    if (!current.includes(status)) {
      updateConfig({ post_status: [...current, status] });
    }
  };

  const removePostStatus = (status: string) => {
    const current = config.post_status || [];
    updateConfig({ post_status: current.filter((s) => s !== status) });
  };

  const addMetaQuery = () => {
    const current = config.meta_query || [];
    updateConfig({
      meta_query: [
        ...current,
        { key: "", value: "", compare: "=" },
      ],
    });
  };

  const updateMetaQuery = (index: number, updates: Partial<MetaQuery>) => {
    const current = config.meta_query || [];
    const updated = current.map((mq, i) => (i === index ? { ...mq, ...updates } : mq));
    updateConfig({ meta_query: updated });
  };

  const removeMetaQuery = (index: number) => {
    const current = config.meta_query || [];
    updateConfig({ meta_query: current.filter((_, i) => i !== index) });
  };

  const addTaxQuery = () => {
    const current = config.tax_query || [];
    updateConfig({
      tax_query: [
        ...current,
        { taxonomy: "", field: "term_id", terms: [], operator: "IN" },
      ],
    });
  };

  const updateTaxQuery = (index: number, updates: Partial<TaxQuery>) => {
    const current = config.tax_query || [];
    const updated = current.map((tq, i) => (i === index ? { ...tq, ...updates } : tq));
    updateConfig({ tax_query: updated });
  };

  const updateTaxQueryTerms = (index: number, terms: string[]) => {
    const current = config.tax_query || [];
    const updated = current.map((tq, i) => (i === index ? { ...tq, terms } : tq));
    updateConfig({ tax_query: updated });
  };

  const removeTaxQuery = (index: number) => {
    const current = config.tax_query || [];
    updateConfig({ tax_query: current.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la requête</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basique</TabsTrigger>
            <TabsTrigger value="meta">Meta</TabsTrigger>
            <TabsTrigger value="taxonomy">Taxonomie</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select onValueChange={addPostType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultPostTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(config.post_type || []).map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <button
                        onClick={() => removePostType(type)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Post Status</Label>
                <Select onValueChange={addPostStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultPostStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(config.post_status || []).map((status) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {status}
                      <button
                        onClick={() => removePostStatus(status)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posts_per_page">Posts par page</Label>
                <Input
                  id="posts_per_page"
                  type="number"
                  value={config.posts_per_page || ""}
                  onChange={(e) =>
                    updateConfig({
                      posts_per_page: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offset">Offset</Label>
                <Input
                  id="offset"
                  type="number"
                  value={config.offset || ""}
                  onChange={(e) =>
                    updateConfig({
                      offset: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paged">Page</Label>
                <Input
                  id="paged"
                  type="number"
                  value={config.paged || ""}
                  onChange={(e) =>
                    updateConfig({
                      paged: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order By</Label>
                <Select
                  value={config.orderby || "date"}
                  onValueChange={(v) => updateConfig({ orderby: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderByOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Select
                  value={config.order || "DESC"}
                  onValueChange={(v) => updateConfig({ order: v as "ASC" | "DESC" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASC">ASC</SelectItem>
                    <SelectItem value="DESC">DESC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                value={config.search || ""}
                onChange={(e) => updateConfig({ search: e.target.value || undefined })}
                placeholder="Terme de recherche"
              />
            </div>
          </TabsContent>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Meta Query</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMetaQuery}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {(config.meta_query || []).map((mq, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meta Query #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMetaQuery(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Clé</Label>
                      <Input
                        value={mq.key}
                        onChange={(e) => updateMetaQuery(index, { key: e.target.value })}
                        placeholder="meta_key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valeur</Label>
                      <Input
                        value={mq.value}
                        onChange={(e) => updateMetaQuery(index, { value: e.target.value })}
                        placeholder="meta_value"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Compare</Label>
                      <Select
                        value={mq.compare}
                        onValueChange={(v) => updateMetaQuery(index, { compare: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {metaCompareOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={mq.type || ""}
                        onValueChange={(v) => updateMetaQuery(index, { type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optionnel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun</SelectItem>
                          {metaTypeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Taxonomy Tab */}
          <TabsContent value="taxonomy" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tax Query</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTaxQuery}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {(config.tax_query || []).map((tq, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tax Query #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTaxQuery(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Taxonomie</Label>
                      <Input
                        value={tq.taxonomy}
                        onChange={(e) => updateTaxQuery(index, { taxonomy: e.target.value })}
                        placeholder="category"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={tq.field}
                        onValueChange={(v) => updateTaxQuery(index, { field: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taxFieldOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Termes (séparés par des virgules)</Label>
                    <Input
                      value={tq.terms.join(", ")}
                      onChange={(e) => {
                        const terms = e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter((t) => t);
                        updateTaxQueryTerms(index, terms);
                      }}
                      placeholder="terme1, terme2, terme3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={tq.operator}
                      onValueChange={(v) => updateTaxQuery(index, { operator: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxOperatorOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Auteur (ID)</Label>
                <Input
                  id="author"
                  type="number"
                  value={Array.isArray(config.author) ? config.author.join(", ") : config.author || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      updateConfig({ author: undefined });
                    } else if (value.includes(",")) {
                      updateConfig({
                        author: value.split(",").map((v) => parseInt(v.trim())).filter((v) => !isNaN(v)),
                      });
                    } else {
                      updateConfig({ author: parseInt(value) || undefined });
                    }
                  }}
                  placeholder="1 ou 1, 2, 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_name">Nom d'auteur</Label>
                <Input
                  id="author_name"
                  value={config.author_name || ""}
                  onChange={(e) => updateConfig({ author_name: e.target.value || undefined })}
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post__in">Post IDs (séparés par des virgules)</Label>
              <Input
                id="post__in"
                value={config.post__in?.join(", ") || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    updateConfig({ post__in: undefined });
                  } else {
                    updateConfig({
                      post__in: value
                        .split(",")
                        .map((v) => parseInt(v.trim()))
                        .filter((v) => !isNaN(v)),
                    });
                  }
                }}
                placeholder="1, 2, 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post__not_in">Post IDs à exclure (séparés par des virgules)</Label>
              <Input
                id="post__not_in"
                value={config.post__not_in?.join(", ") || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    updateConfig({ post__not_in: undefined });
                  } else {
                    updateConfig({
                      post__not_in: value
                        .split(",")
                        .map((v) => parseInt(v.trim()))
                        .filter((v) => !isNaN(v)),
                    });
                  }
                }}
                placeholder="1, 2, 3"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QueryBuilder;

