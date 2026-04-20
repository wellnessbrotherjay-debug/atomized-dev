import { SqlGenerator, QueryContext } from "./sql-generator";
import { Widget } from "../schemas/widget-types";

// Mock for BigQuery client or similar service
interface DataService {
  query(sql: string): Promise<any[]>;
}

export class WidgetResolver {
  constructor(private dataService: DataService) {}

  async resolve(widget: Widget, context: QueryContext): Promise<any> {
    console.log(`Resolving widget: ${widget.id} (${widget.type}) for tenant: ${context.tenant_id}`);

    // 1. Generate SQL
    const sql = SqlGenerator.generate(widget, context);

    // 2. Check Cache (logic to be implemented with Redis/DB)
    // const cached = await this.cache.get(this.generateCacheKey(widget, context));
    // if (cached) return cached;

    // 3. Execute Query
    try {
      const results = await this.dataService.query(sql);

      const payload = {
        widget_id: widget.id,
        type: widget.type,
        data: results,
        metadata: {
          executed_at: new Date().toISOString(),
          context: context,
        }
      };

      // 4. Set Cache
      // await this.cache.set(this.generateCacheKey(widget, context), payload);

      return payload;
    } catch (error) {
      console.error(`Error resolving widget ${widget.id}:`, error);
      throw error;
    }
  }

  private generateCacheKey(widget: Widget, context: QueryContext): string {
    return `widget:${widget.id}:tenant:${context.tenant_id}:${context.period_start}:${context.period_end}`;
  }
}
