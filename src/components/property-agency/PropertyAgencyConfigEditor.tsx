"use client";

import { Plus, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/property-agency/ImageUploadField";
import { ThemeAccentPicker } from "@/components/property-agency/ThemeAccentPicker";
import { ThemeColorPicker } from "@/components/property-agency/ThemeColorPicker";
import { Button } from "@/components/ui/Button";
import type { PropertyAgencySite } from "@/lib/db/schema";
import type {
  BlogPost,
  HowItWorksStep,
  PopularArea,
  PropertyAgencyConfig,
  PropertyAgent,
  PropertyCategory,
  PropertyListing,
  PropertyTestimonial,
  WhyChooseUsItem,
} from "@/lib/property-agency/schemas";
import { resolveThemeAccent } from "@/lib/property-agency/theme-accents";
import { cn } from "@/lib/utils";

type SiteDraft = Pick<
  PropertyAgencySite,
  "id" | "slug" | "name" | "isPublished" | "updatedAt"
> & {
  config: PropertyAgencyConfig;
};

type Props = {
  draft: SiteDraft;
  t: ReturnType<typeof import("@/components/layout/LocaleProvider").useLocale>["t"];
  inputClass: string;
  patchConfig: (patch: Partial<PropertyAgencyConfig>) => void;
  patchListing: (id: string, patch: Partial<PropertyListing>) => void;
  addListing: () => void;
  removeListing: (id: string) => void;
  setDraft: React.Dispatch<React.SetStateAction<SiteDraft | null>>;
};

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-medium text-foreground/55">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ListEditor<T extends { id: string }>({
  items,
  onAdd,
  addLabel,
  renderItem,
}: {
  items: T[];
  onAdd: () => void;
  addLabel: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <>
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </div>
      <ul className="mt-4 space-y-4">{items.map((item, i) => renderItem(item, i))}</ul>
    </>
  );
}

export function PropertyAgencyConfigEditor({
  draft,
  t,
  inputClass,
  patchConfig,
  patchListing,
  addListing,
  removeListing,
  setDraft,
}: Props) {
  function patchList<K extends keyof PropertyAgencyConfig>(
    key: K,
    updater: (items: NonNullable<PropertyAgencyConfig[K]>) => PropertyAgencyConfig[K]
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = (prev.config[key] ?? []) as NonNullable<PropertyAgencyConfig[K]>;
      return {
        ...prev,
        config: { ...prev.config, [key]: updater(current) },
      };
    });
  }

  const uploadProps = {
    siteSlug: draft.slug,
    inputClass,
    uploadLabel: t("propertyAgency.uploadImage"),
    uploadingLabel: t("propertyAgency.uploading"),
    orPasteUrlLabel: t("propertyAgency.orPasteUrl"),
    notConfiguredLabel: t("propertyAgency.firebaseNotConfigured"),
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionGeneral")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("propertyAgency.fieldName")}>
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) =>
                setDraft((p) => (p ? { ...p, name: e.target.value } : p))
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldPublished")}>
            <select
              className={inputClass}
              value={draft.isPublished ? "yes" : "no"}
              onChange={(e) =>
                setDraft((p) =>
                  p ? { ...p, isPublished: e.target.value === "yes" } : p
                )
              }
            >
              <option value="yes">{t("propertyAgency.published")}</option>
              <option value="no">{t("propertyAgency.draft")}</option>
            </select>
          </Field>
          <Field label={t("propertyAgency.fieldLogo")} className="sm:col-span-2">
            <ImageUploadField
              {...uploadProps}
              value={draft.config.theme?.logoUrl ?? ""}
              onChange={(logoUrl) =>
                patchConfig({
                  theme: { ...draft.config.theme, logoUrl },
                })
              }
              uploadPrefix="logo"
            />
          </Field>
          <Field label={t("propertyAgency.fieldTheme")} className="sm:col-span-2">
            <ThemeAccentPicker
              value={resolveThemeAccent(draft.config.theme?.accent)}
              onChange={(accent) =>
                patchConfig({
                  theme: {
                    ...draft.config.theme,
                    accent,
                    customColor: "",
                  },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldCustomColor")} className="sm:col-span-2">
            <ThemeColorPicker
              value={draft.config.theme?.customColor ?? ""}
              onChange={(customColor) =>
                patchConfig({
                  theme: { ...draft.config.theme, customColor },
                })
              }
              onClear={() =>
                patchConfig({
                  theme: { ...draft.config.theme, customColor: "" },
                })
              }
              inputClass={inputClass}
              clearLabel={t("propertyAgency.clearCustomColor")}
              hint={t("propertyAgency.fieldCustomColorHint")}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionHero")}</h2>
        <div className="mt-4 grid gap-4">
          <Field label={t("propertyAgency.fieldHeroTitle")}>
            <input
              className={inputClass}
              value={draft.config.hero.title}
              onChange={(e) =>
                patchConfig({ hero: { ...draft.config.hero, title: e.target.value } })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldHeroSubtitle")}>
            <input
              className={inputClass}
              value={draft.config.hero.subtitle ?? ""}
              onChange={(e) =>
                patchConfig({
                  hero: { ...draft.config.hero, subtitle: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldCtaPrimary")}>
            <input
              className={inputClass}
              value={draft.config.hero.ctaPrimary ?? ""}
              onChange={(e) =>
                patchConfig({
                  hero: { ...draft.config.hero, ctaPrimary: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldCtaSecondary")}>
            <input
              className={inputClass}
              value={draft.config.hero.ctaSecondary ?? ""}
              onChange={(e) =>
                patchConfig({
                  hero: { ...draft.config.hero, ctaSecondary: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldImageUrl")}>
            <ImageUploadField
              {...uploadProps}
              value={draft.config.hero.imageUrl ?? ""}
              onChange={(imageUrl) =>
                patchConfig({ hero: { ...draft.config.hero, imageUrl } })
              }
              uploadPrefix="hero"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionCategories")}</h2>
        <ListEditor
          items={draft.config.categories ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("categories", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                label: "New category",
                icon: "🏠",
                description: "",
              } satisfies PropertyCategory,
            ])
          }
          renderItem={(cat) => (
            <li key={cat.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t("propertyAgency.fieldLabel")}>
                  <input
                    className={inputClass}
                    value={cat.label}
                    onChange={(e) =>
                      patchList("categories", (items) =>
                        items.map((c) =>
                          c.id === cat.id ? { ...c, label: e.target.value } : c
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldIcon")}>
                  <input
                    className={inputClass}
                    value={cat.icon ?? ""}
                    onChange={(e) =>
                      patchList("categories", (items) =>
                        items.map((c) =>
                          c.id === cat.id ? { ...c, icon: e.target.value } : c
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldDescription")}>
                  <input
                    className={inputClass}
                    value={cat.description ?? ""}
                    onChange={(e) =>
                      patchList("categories", (items) =>
                        items.map((c) =>
                          c.id === cat.id
                            ? { ...c, description: e.target.value }
                            : c
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("categories", (items) =>
                    items.filter((c) => c.id !== cat.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{t("propertyAgency.sectionListings")}</h2>
          <Button type="button" size="sm" variant="outline" onClick={addListing}>
            <Plus className="h-4 w-4" /> {t("propertyAgency.addListing")}
          </Button>
        </div>
        <ul className="mt-4 space-y-4">
          {(draft.config.listings ?? []).map((listing) => (
            <li key={listing.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldListingTitle")}>
                  <input
                    className={inputClass}
                    value={listing.title}
                    onChange={(e) => patchListing(listing.id, { title: e.target.value })}
                  />
                </Field>
                <Field label={t("propertyAgency.fieldLocation")}>
                  <input
                    className={inputClass}
                    value={listing.location}
                    onChange={(e) =>
                      patchListing(listing.id, { location: e.target.value })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldPrice")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={listing.price}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldType")}>
                  <input
                    className={inputClass}
                    value={listing.type}
                    onChange={(e) => patchListing(listing.id, { type: e.target.value })}
                  />
                </Field>
                <Field label={t("propertyAgency.fieldBedrooms")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={listing.bedrooms}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        bedrooms: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldBathrooms")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={listing.bathrooms}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        bathrooms: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldArea")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={listing.area}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        area: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldLandArea")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={listing.landArea ?? 0}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        landArea: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldFacilities")} className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={(listing.facilities ?? []).join(", ")}
                    onChange={(e) =>
                      patchListing(listing.id, {
                        facilities: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Carport, Taman, One Gate"
                  />
                </Field>
                <Field label={t("propertyAgency.fieldDescription")} className="sm:col-span-2">
                  <textarea
                    className={cn(inputClass, "min-h-[100px] resize-y")}
                    value={listing.description ?? ""}
                    onChange={(e) =>
                      patchListing(listing.id, { description: e.target.value })
                    }
                    placeholder={t("propertyAgency.fieldDescriptionHint")}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <span className="text-xs font-medium text-foreground/55">
                    {t("propertyAgency.fieldSpecifications")}
                  </span>
                  <ul className="mt-1.5 space-y-2">
                    {(listing.specifications ?? []).map((spec, si) => (
                      <li key={si} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          className={inputClass}
                          value={spec.label}
                          placeholder={t("propertyAgency.fieldSpecLabel")}
                          onChange={(e) => {
                            const next = [...(listing.specifications ?? [])];
                            next[si] = { ...spec, label: e.target.value };
                            patchListing(listing.id, { specifications: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={spec.value}
                          placeholder={t("propertyAgency.fieldSpecValue")}
                          onChange={(e) => {
                            const next = [...(listing.specifications ?? [])];
                            next[si] = { ...spec, value: e.target.value };
                            patchListing(listing.id, { specifications: next });
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            patchListing(listing.id, {
                              specifications: (listing.specifications ?? []).filter(
                                (_, i) => i !== si
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      patchListing(listing.id, {
                        specifications: [
                          ...(listing.specifications ?? []),
                          { label: "", value: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> {t("propertyAgency.addSpec")}
                  </Button>
                </div>
                <Field label={t("propertyAgency.fieldCoverImage")} className="sm:col-span-2">
                  <ImageUploadField
                    {...uploadProps}
                    value={listing.imageUrl ?? ""}
                    onChange={(imageUrl) => patchListing(listing.id, { imageUrl })}
                    uploadPrefix={`listing-${listing.id.slice(0, 8)}-cover`}
                  />
                </Field>
                <Field label={t("propertyAgency.fieldFloorPlan")} className="sm:col-span-2">
                  <ImageUploadField
                    {...uploadProps}
                    value={listing.floorPlanUrl ?? ""}
                    onChange={(floorPlanUrl) =>
                      patchListing(listing.id, { floorPlanUrl })
                    }
                    uploadPrefix={`listing-${listing.id.slice(0, 8)}-plan`}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <span className="text-xs font-medium text-foreground/55">
                    {t("propertyAgency.fieldGallery")}
                  </span>
                  <ul className="mt-1.5 space-y-3">
                    {(listing.galleryUrls ?? []).map((url, gi) => (
                      <li key={gi}>
                        <ImageUploadField
                          {...uploadProps}
                          value={url}
                          onChange={(imageUrl) => {
                            const next = [...(listing.galleryUrls ?? [])];
                            next[gi] = imageUrl;
                            patchListing(listing.id, { galleryUrls: next });
                          }}
                          uploadPrefix={`listing-${listing.id.slice(0, 8)}-g${gi}`}
                        />
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      patchListing(listing.id, {
                        galleryUrls: [...(listing.galleryUrls ?? []), ""],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> {t("propertyAgency.addGalleryPhoto")}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => removeListing(listing.id)}
              >
                <Trash2 className="h-4 w-4" /> {t("propertyAgency.removeListing")}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionHowItWorks")}</h2>
        <ListEditor
          items={draft.config.howItWorks ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("howItWorks", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                step: items.length + 1,
                title: "New step",
                description: "",
              } satisfies HowItWorksStep,
            ])
          }
          renderItem={(step) => (
            <li key={step.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldStep")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={step.step}
                    onChange={(e) =>
                      patchList("howItWorks", (items) =>
                        items.map((s) =>
                          s.id === step.id
                            ? { ...s, step: Number(e.target.value) || 1 }
                            : s
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldTitle")}>
                  <input
                    className={inputClass}
                    value={step.title}
                    onChange={(e) =>
                      patchList("howItWorks", (items) =>
                        items.map((s) =>
                          s.id === step.id ? { ...s, title: e.target.value } : s
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldDescription")} className="sm:col-span-2">
                  <textarea
                    className={cn(inputClass, "min-h-[72px] resize-y")}
                    value={step.description}
                    onChange={(e) =>
                      patchList("howItWorks", (items) =>
                        items.map((s) =>
                          s.id === step.id
                            ? { ...s, description: e.target.value }
                            : s
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("howItWorks", (items) =>
                    items.filter((s) => s.id !== step.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionWhyChooseUs")}</h2>
        <Field label={t("propertyAgency.sectionAbout")} className="mb-4">
          <textarea
            className={cn(inputClass, "min-h-[80px] resize-y")}
            value={draft.config.about ?? ""}
            onChange={(e) => patchConfig({ about: e.target.value })}
          />
        </Field>
        <ListEditor
          items={draft.config.whyChooseUs ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("whyChooseUs", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                value: "100+",
                label: "New stat",
                description: "",
              } satisfies WhyChooseUsItem,
            ])
          }
          renderItem={(item) => (
            <li key={item.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t("propertyAgency.fieldStatValue")}>
                  <input
                    className={inputClass}
                    value={item.value}
                    onChange={(e) =>
                      patchList("whyChooseUs", (items) =>
                        items.map((i) =>
                          i.id === item.id ? { ...i, value: e.target.value } : i
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldLabel")}>
                  <input
                    className={inputClass}
                    value={item.label}
                    onChange={(e) =>
                      patchList("whyChooseUs", (items) =>
                        items.map((i) =>
                          i.id === item.id ? { ...i, label: e.target.value } : i
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldDescription")}>
                  <input
                    className={inputClass}
                    value={item.description ?? ""}
                    onChange={(e) =>
                      patchList("whyChooseUs", (items) =>
                        items.map((i) =>
                          i.id === item.id
                            ? { ...i, description: e.target.value }
                            : i
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("whyChooseUs", (items) =>
                    items.filter((i) => i.id !== item.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionAgents")}</h2>
        <ListEditor
          items={draft.config.agents ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("agents", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                name: "New agent",
                role: "",
                rating: 5,
                phone: "",
                imageUrl: "",
                listingsSold: 0,
              } satisfies PropertyAgent,
            ])
          }
          renderItem={(agent) => (
            <li key={agent.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldAgentName")}>
                  <input
                    className={inputClass}
                    value={agent.name}
                    onChange={(e) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id ? { ...a, name: e.target.value } : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldAgentRole")}>
                  <input
                    className={inputClass}
                    value={agent.role ?? ""}
                    onChange={(e) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id ? { ...a, role: e.target.value } : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldRating")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={agent.rating ?? 5}
                    onChange={(e) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id
                            ? { ...a, rating: Number(e.target.value) || 0 }
                            : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldPhone")}>
                  <input
                    className={inputClass}
                    value={agent.phone ?? ""}
                    onChange={(e) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id ? { ...a, phone: e.target.value } : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldListingsSold")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={agent.listingsSold ?? 0}
                    onChange={(e) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id
                            ? { ...a, listingsSold: Number(e.target.value) || 0 }
                            : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldImageUrl")}>
                  <ImageUploadField
                    {...uploadProps}
                    value={agent.imageUrl ?? ""}
                    onChange={(imageUrl) =>
                      patchList("agents", (items) =>
                        items.map((a) =>
                          a.id === agent.id ? { ...a, imageUrl } : a
                        )
                      )
                    }
                    uploadPrefix={`agent-${agent.id.slice(0, 8)}`}
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("agents", (items) => items.filter((a) => a.id !== agent.id))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionTestimonials")}</h2>
        <ListEditor
          items={draft.config.testimonials ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("testimonials", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                name: "Client name",
                role: "",
                quote: "",
                rating: 5,
              } satisfies PropertyTestimonial,
            ])
          }
          renderItem={(item) => (
            <li key={item.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldAgentName")}>
                  <input
                    className={inputClass}
                    value={item.name}
                    onChange={(e) =>
                      patchList("testimonials", (items) =>
                        items.map((i) =>
                          i.id === item.id ? { ...i, name: e.target.value } : i
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldAgentRole")}>
                  <input
                    className={inputClass}
                    value={item.role ?? ""}
                    onChange={(e) =>
                      patchList("testimonials", (items) =>
                        items.map((i) =>
                          i.id === item.id ? { ...i, role: e.target.value } : i
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldQuote")} className="sm:col-span-2">
                  <textarea
                    className={cn(inputClass, "min-h-[72px] resize-y")}
                    value={item.quote}
                    onChange={(e) =>
                      patchList("testimonials", (items) =>
                        items.map((i) =>
                          i.id === item.id ? { ...i, quote: e.target.value } : i
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldRating")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={item.rating ?? 5}
                    onChange={(e) =>
                      patchList("testimonials", (items) =>
                        items.map((i) =>
                          i.id === item.id
                            ? { ...i, rating: Number(e.target.value) || 0 }
                            : i
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("testimonials", (items) =>
                    items.filter((i) => i.id !== item.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionPopularAreas")}</h2>
        <ListEditor
          items={draft.config.popularAreas ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("popularAreas", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                name: "New area",
                listingCount: 0,
                imageUrl: "",
              } satisfies PopularArea,
            ])
          }
          renderItem={(area) => (
            <li key={area.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldLocation")}>
                  <input
                    className={inputClass}
                    value={area.name}
                    onChange={(e) =>
                      patchList("popularAreas", (items) =>
                        items.map((a) =>
                          a.id === area.id ? { ...a, name: e.target.value } : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldListingCount")}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={area.listingCount ?? 0}
                    onChange={(e) =>
                      patchList("popularAreas", (items) =>
                        items.map((a) =>
                          a.id === area.id
                            ? { ...a, listingCount: Number(e.target.value) || 0 }
                            : a
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldImageUrl")} className="sm:col-span-2">
                  <ImageUploadField
                    {...uploadProps}
                    value={area.imageUrl ?? ""}
                    onChange={(imageUrl) =>
                      patchList("popularAreas", (items) =>
                        items.map((a) =>
                          a.id === area.id ? { ...a, imageUrl } : a
                        )
                      )
                    }
                    uploadPrefix={`area-${area.id.slice(0, 8)}`}
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("popularAreas", (items) =>
                    items.filter((a) => a.id !== area.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionBlog")}</h2>
        <ListEditor
          items={draft.config.blogPosts ?? []}
          addLabel={t("propertyAgency.addItem")}
          onAdd={() =>
            patchList("blogPosts", (items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                title: "New article",
                excerpt: "",
                content: "",
                category: "Tips",
                date: "",
                imageUrl: "",
              } satisfies BlogPost,
            ])
          }
          renderItem={(post) => (
            <li key={post.id} className="rounded-lg border border-foreground/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("propertyAgency.fieldTitle")}>
                  <input
                    className={inputClass}
                    value={post.title}
                    onChange={(e) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, title: e.target.value } : p
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldCategory")}>
                  <input
                    className={inputClass}
                    value={post.category ?? ""}
                    onChange={(e) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, category: e.target.value } : p
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldExcerpt")} className="sm:col-span-2">
                  <textarea
                    className={cn(inputClass, "min-h-[72px] resize-y")}
                    value={post.excerpt}
                    onChange={(e) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, excerpt: e.target.value } : p
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldContent")} className="sm:col-span-2">
                  <textarea
                    className={cn(inputClass, "min-h-[160px] resize-y")}
                    value={post.content ?? ""}
                    onChange={(e) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, content: e.target.value } : p
                        )
                      )
                    }
                    placeholder={t("propertyAgency.fieldContentHint")}
                  />
                </Field>
                <Field label={t("propertyAgency.fieldDate")}>
                  <input
                    className={inputClass}
                    value={post.date ?? ""}
                    onChange={(e) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, date: e.target.value } : p
                        )
                      )
                    }
                  />
                </Field>
                <Field label={t("propertyAgency.fieldImageUrl")}>
                  <ImageUploadField
                    {...uploadProps}
                    value={post.imageUrl ?? ""}
                    onChange={(imageUrl) =>
                      patchList("blogPosts", (items) =>
                        items.map((p) =>
                          p.id === post.id ? { ...p, imageUrl } : p
                        )
                      )
                    }
                    uploadPrefix={`blog-${post.id.slice(0, 8)}`}
                  />
                </Field>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  patchList("blogPosts", (items) =>
                    items.filter((p) => p.id !== post.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )}
        />
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionContact")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("propertyAgency.fieldPhone")}>
            <input
              className={inputClass}
              value={draft.config.contact.phone ?? ""}
              onChange={(e) =>
                patchConfig({
                  contact: { ...draft.config.contact, phone: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldWhatsapp")}>
            <input
              className={inputClass}
              value={draft.config.contact.whatsapp ?? ""}
              onChange={(e) =>
                patchConfig({
                  contact: { ...draft.config.contact, whatsapp: e.target.value },
                })
              }
              placeholder="6281234567890"
            />
          </Field>
          <Field label={t("propertyAgency.fieldEmail")}>
            <input
              className={inputClass}
              type="email"
              value={draft.config.contact.email ?? ""}
              onChange={(e) =>
                patchConfig({
                  contact: { ...draft.config.contact, email: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldAddress")}>
            <input
              className={inputClass}
              value={draft.config.contact.address ?? ""}
              onChange={(e) =>
                patchConfig({
                  contact: { ...draft.config.contact, address: e.target.value },
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.config.contact.showForm !== false}
              onChange={(e) =>
                patchConfig({
                  contact: {
                    ...draft.config.contact,
                    showForm: e.target.checked,
                  },
                })
              }
            />
            {t("propertyAgency.fieldShowContactForm")}
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-foreground/10 p-5">
        <h2 className="text-sm font-semibold">{t("propertyAgency.sectionFooter")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("propertyAgency.fieldFooterTagline")} className="sm:col-span-2">
            <textarea
              className={cn(inputClass, "min-h-[72px] resize-y")}
              value={draft.config.footer?.tagline ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, tagline: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Facebook">
            <input
              className={inputClass}
              value={draft.config.footer?.facebook ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, facebook: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Instagram">
            <input
              className={inputClass}
              value={draft.config.footer?.instagram ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, instagram: e.target.value },
                })
              }
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className={inputClass}
              value={draft.config.footer?.linkedin ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, linkedin: e.target.value },
                })
              }
            />
          </Field>
          <Field label="YouTube">
            <input
              className={inputClass}
              value={draft.config.footer?.youtube ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, youtube: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldPrivacyUrl")}>
            <input
              className={inputClass}
              value={draft.config.footer?.privacyUrl ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, privacyUrl: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t("propertyAgency.fieldTermsUrl")}>
            <input
              className={inputClass}
              value={draft.config.footer?.termsUrl ?? ""}
              onChange={(e) =>
                patchConfig({
                  footer: { ...draft.config.footer, termsUrl: e.target.value },
                })
              }
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
