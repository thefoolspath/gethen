import { createComponent } from "@angular/core";
import type {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  EmbeddedViewRef,
  TemplateRef,
  Type
} from "@angular/core";
import type {
  GridCellContext,
  GridCellEditor,
  GridCellRenderer,
  GridColumnView,
  GridEditorContext,
  GridEditorValue,
  GridRow,
  GridValidationResult
} from "@thefoolspath/gethen-core";

export interface GethenAngularGridColumn<TRow extends GridRow = GridRow>
  extends GridColumnView<TRow> {
  readonly angularRenderer?: string;
  readonly angularEditor?: string;
}

export interface GethenAngularRendererComponent<TRow extends GridRow = GridRow> {
  context: GridCellContext<TRow>;
}

export interface GethenAngularEditorComponent<TRow extends GridRow = GridRow> {
  context: GridEditorContext<TRow>;
  focus(): void;
  getValue(): GridEditorValue;
  validate(value: GridEditorValue): GridValidationResult | Promise<GridValidationResult>;
  commit(value: GridEditorValue): void | Promise<void>;
  cancel(): void | Promise<void>;
}

export type GethenAngularRendererRegistration<TRow extends GridRow = GridRow> =
  | {
      readonly kind: "template";
      readonly template: TemplateRef<{ $implicit: GridCellContext<TRow> }>;
    }
  | {
      readonly kind: "component";
      readonly component: Type<GethenAngularRendererComponent<TRow>>;
    };

export interface GethenAngularEditorRegistration<TRow extends GridRow = GridRow> {
  readonly component: Type<GethenAngularEditorComponent<TRow>>;
}

export type GethenAngularRendererRegistry<TRow extends GridRow = GridRow> = Readonly<
  Record<string, GethenAngularRendererRegistration<TRow>>
>;
export type GethenAngularEditorRegistry<TRow extends GridRow = GridRow> = Readonly<
  Record<string, GethenAngularEditorRegistration<TRow>>
>;

export interface ResolveAngularGridColumnsOptions<TRow extends GridRow = GridRow> {
  readonly columns: readonly GethenAngularGridColumn<TRow>[];
  readonly rendererRegistry?: GethenAngularRendererRegistry<TRow>;
  readonly editorRegistry?: GethenAngularEditorRegistry<TRow>;
  readonly applicationRef: ApplicationRef;
  readonly environmentInjector: EnvironmentInjector;
}

export function resolveAngularGridColumns<TRow extends GridRow>(
  options: ResolveAngularGridColumnsOptions<TRow>
): readonly GridColumnView<TRow>[] {
  return options.columns.map((column) => ({
    ...column,
    ...(column.angularRenderer
      ? {
          renderer: createRendererFactory(
            requireRegistration(options.rendererRegistry, column.angularRenderer, "renderer"),
            options.applicationRef,
            options.environmentInjector
          )
        }
      : {}),
    ...(column.angularEditor
      ? {
          editor: createEditorFactory(
            requireRegistration(options.editorRegistry, column.angularEditor, "editor"),
            options.applicationRef,
            options.environmentInjector
          )
        }
      : {})
  }));
}

function createRendererFactory<TRow extends GridRow>(
  registration: GethenAngularRendererRegistration<TRow>,
  applicationRef: ApplicationRef,
  environmentInjector: EnvironmentInjector
): () => GridCellRenderer<TRow> {
  return () => registration.kind === "template"
    ? new AngularTemplateRenderer(registration.template, applicationRef)
    : new AngularComponentRenderer(registration.component, applicationRef, environmentInjector);
}

function createEditorFactory<TRow extends GridRow>(
  registration: GethenAngularEditorRegistration<TRow>,
  applicationRef: ApplicationRef,
  environmentInjector: EnvironmentInjector
): () => GridCellEditor<TRow> {
  return () => new AngularComponentEditor(
    registration.component,
    applicationRef,
    environmentInjector
  );
}

class AngularTemplateRenderer<TRow extends GridRow> implements GridCellRenderer<TRow> {
  #view: EmbeddedViewRef<{ $implicit: GridCellContext<TRow> }> | undefined;

  constructor(
    private readonly template: TemplateRef<{ $implicit: GridCellContext<TRow> }>,
    private readonly applicationRef: ApplicationRef
  ) {}

  mount(host: HTMLElement, context: GridCellContext<TRow>): void {
    this.#view = this.template.createEmbeddedView({ $implicit: context });
    this.applicationRef.attachView(this.#view);
    this.#view.detectChanges();
    host.append(...this.#view.rootNodes);
  }

  update(context: GridCellContext<TRow>): void {
    if (this.#view) {
      this.#view.context.$implicit = context;
      this.#view.detectChanges();
    }
  }

  destroy(): void {
    if (this.#view) {
      this.applicationRef.detachView(this.#view);
      this.#view.destroy();
      this.#view = undefined;
    }
  }
}

class AngularComponentRenderer<TRow extends GridRow> implements GridCellRenderer<TRow> {
  #component: ComponentRef<GethenAngularRendererComponent<TRow>> | undefined;

  constructor(
    private readonly componentType: Type<GethenAngularRendererComponent<TRow>>,
    private readonly applicationRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector
  ) {}

  mount(host: HTMLElement, context: GridCellContext<TRow>): void {
    this.#component = createComponent(this.componentType, { environmentInjector: this.environmentInjector });
    this.applicationRef.attachView(this.#component.hostView);
    this.#component.setInput("context", context);
    this.#component.changeDetectorRef.detectChanges();
    host.appendChild(this.#component.location.nativeElement);
  }

  update(context: GridCellContext<TRow>): void {
    this.#component?.setInput("context", context);
    this.#component?.changeDetectorRef.detectChanges();
  }

  destroy(): void {
    if (this.#component) {
      this.applicationRef.detachView(this.#component.hostView);
      this.#component.destroy();
      this.#component = undefined;
    }
  }
}

class AngularComponentEditor<TRow extends GridRow> implements GridCellEditor<TRow> {
  #component: ComponentRef<GethenAngularEditorComponent<TRow>> | undefined;

  constructor(
    private readonly componentType: Type<GethenAngularEditorComponent<TRow>>,
    private readonly applicationRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector
  ) {}

  mount(host: HTMLElement, context: GridEditorContext<TRow>): void {
    this.#component = createComponent(this.componentType, { environmentInjector: this.environmentInjector });
    this.applicationRef.attachView(this.#component.hostView);
    this.#component.setInput("context", context);
    this.#component.changeDetectorRef.detectChanges();
    host.appendChild(this.#component.location.nativeElement);
  }

  update(context: GridEditorContext<TRow>): void {
    this.#component?.setInput("context", context);
    this.#component?.changeDetectorRef.detectChanges();
  }

  focus(): void { this.requireComponent().instance.focus(); }
  getValue(): GridEditorValue { return this.requireComponent().instance.getValue(); }
  validate(value: GridEditorValue) { return this.requireComponent().instance.validate(value); }
  commit(value: GridEditorValue) { return this.requireComponent().instance.commit(value); }
  cancel() { return this.requireComponent().instance.cancel(); }

  destroy(): void {
    if (this.#component) {
      this.applicationRef.detachView(this.#component.hostView);
      this.#component.destroy();
      this.#component = undefined;
    }
  }

  private requireComponent(): ComponentRef<GethenAngularEditorComponent<TRow>> {
    if (!this.#component) throw new Error("Angular grid editor is not mounted.");
    return this.#component;
  }
}

function requireRegistration<T>(
  registry: Readonly<Record<string, T>> | undefined,
  key: string,
  kind: string
): T {
  const registration = registry?.[key];
  if (!registration) throw new Error(`Unknown Angular ${kind} registry key '${key}'.`);
  return registration;
}
