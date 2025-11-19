# Feature Proposal: Cost Tracking & Budget Management

## 🎯 Problema

Desenvolvedores não têm visibilidade dos custos de suas aplicações AI até receberem a fatura. Isso leva a:

- Surpresas desagradáveis na fatura
- Dificuldade em otimizar custos
- Impossibilidade de prever gastos
- Falta de controle em ambientes de desenvolvimento

## 💡 Solução: Built-in Cost Tracking

### API Proposta

```typescript
import { createAgent } from "mcp-agent-kit";

const agent = createAgent({
  provider: "openai",
  model: "gpt-4-turbo-preview",

  // 🆕 COST TRACKING
  costTracking: {
    enabled: true,

    // Budget mensal em USD
    budget: {
      monthly: 100.0,
      daily: 10.0,
      perRequest: 0.5,
    },

    // Alertas
    alerts: {
      thresholds: [0.5, 0.8, 0.9, 1.0], // 50%, 80%, 90%, 100%
      onThresholdReached: (usage) => {
        console.log(`⚠️ Budget alert: ${usage.percentage}% used`);
        sendSlackNotification(usage);
      },
    },

    // Ações automáticas
    actions: {
      onBudgetExceeded: "throttle", // "block" | "throttle" | "warn" | "allow"
      throttleRate: 0.5, // Reduz para 50% da velocidade
      blockMessage: "Budget exceeded. Please increase limit.",
    },

    // Exportar dados
    export: {
      format: "json", // "json" | "csv" | "prometheus"
      destination: "./costs.json",
      interval: "daily", // "realtime" | "hourly" | "daily"
    },
  },
});

// Obter custos em tempo real
const costs = agent.getCosts();
console.log(costs);
// {
//   total: 2.45,
//   today: 0.32,
//   thisMonth: 2.45,
//   requests: 150,
//   avgPerRequest: 0.016,
//   breakdown: {
//     inputTokens: { count: 45000, cost: 1.35 },
//     outputTokens: { count: 22000, cost: 1.10 }
//   },
//   budgetStatus: {
//     monthly: { used: 2.45, limit: 100, percentage: 2.45 },
//     daily: { used: 0.32, limit: 10, percentage: 3.2 }
//   }
// }

// Projeção de custos
const projection = agent.projectCosts({
  period: "month",
  basedOn: "last7days",
});
console.log(projection);
// {
//   estimated: 15.40,
//   confidence: 0.85,
//   trend: "increasing",
//   recommendation: "Consider using gpt-3.5-turbo for simple queries"
// }
```

### Implementação Interna

```typescript
class CostTracker {
  private costs: CostData[] = [];
  private budget: BudgetConfig;

  // Preços por modelo (atualizado automaticamente)
  private pricing = {
    "gpt-4-turbo-preview": {
      input: 0.01 / 1000, // $0.01 per 1K tokens
      output: 0.03 / 1000,
    },
    "gpt-3.5-turbo": {
      input: 0.0005 / 1000,
      output: 0.0015 / 1000,
    },
    "claude-3-opus": {
      input: 0.015 / 1000,
      output: 0.075 / 1000,
    },
    "gemini-2.5-flash": {
      input: 0.00025 / 1000,
      output: 0.0005 / 1000,
    },
  };

  trackRequest(request: Request, response: Response) {
    const cost = this.calculateCost(request, response);

    this.costs.push({
      timestamp: new Date(),
      model: request.model,
      inputTokens: response.usage.promptTokens,
      outputTokens: response.usage.completionTokens,
      cost: cost,
      metadata: {
        toolCalls: response.toolCalls?.length || 0,
        cached: response.cached || false,
      },
    });

    // Check budget
    this.checkBudget();

    // Export if needed
    if (this.shouldExport()) {
      this.export();
    }
  }

  calculateCost(request: Request, response: Response): number {
    const pricing = this.pricing[request.model];
    if (!pricing) return 0;

    const inputCost = response.usage.promptTokens * pricing.input;
    const outputCost = response.usage.completionTokens * pricing.output;

    return inputCost + outputCost;
  }

  checkBudget() {
    const usage = this.getCurrentUsage();

    // Check thresholds
    for (const threshold of this.budget.alerts.thresholds) {
      if (usage.percentage >= threshold * 100 && !this.alerted[threshold]) {
        this.budget.alerts.onThresholdReached(usage);
        this.alerted[threshold] = true;
      }
    }

    // Take action if exceeded
    if (usage.percentage >= 100) {
      this.handleBudgetExceeded();
    }
  }

  handleBudgetExceeded() {
    switch (this.budget.actions.onBudgetExceeded) {
      case "block":
        throw new BudgetExceededError(this.budget.actions.blockMessage);
      case "throttle":
        this.enableThrottling(this.budget.actions.throttleRate);
        break;
      case "warn":
        console.warn("⚠️ Budget exceeded!");
        break;
      case "allow":
        // Continue normally
        break;
    }
  }

  projectCosts(options: ProjectionOptions): CostProjection {
    const recentCosts = this.getRecentCosts(options.basedOn);
    const avgDailyCost = this.calculateAverage(recentCosts);

    let estimated: number;
    if (options.period === "month") {
      estimated = avgDailyCost * 30;
    } else if (options.period === "week") {
      estimated = avgDailyCost * 7;
    }

    // Analyze trend
    const trend = this.analyzeTrend(recentCosts);

    // Generate recommendation
    const recommendation = this.generateRecommendation(estimated, trend);

    return {
      estimated,
      confidence: this.calculateConfidence(recentCosts),
      trend,
      recommendation,
    };
  }

  generateRecommendation(estimated: number, trend: string): string {
    if (estimated > this.budget.monthly * 0.8) {
      return "Consider using cheaper models or implementing caching";
    }
    if (trend === "increasing") {
      return "Usage is increasing. Monitor closely.";
    }
    return "Usage is within expected range";
  }
}
```

### Dashboard Web (Opcional)

```typescript
import { createCostDashboard } from "mcp-agent-kit/dashboard";

const dashboard = createCostDashboard({
  port: 3002,
  agents: [agent1, agent2, agent3],
  features: {
    realtime: true,
    charts: true,
    export: true,
    alerts: true,
  },
});

// Acesse http://localhost:3002
```

Dashboard mostra:

- 📊 Gráfico de custos ao longo do tempo
- 💰 Breakdown por modelo
- 🔧 Custos por tool
- 📈 Projeções
- ⚠️ Alertas ativos
- 📥 Export de dados

### Integração com Monitoring

```typescript
// Prometheus metrics
import { PrometheusExporter } from "mcp-agent-kit/exporters";

const exporter = new PrometheusExporter({
  port: 9090,
  metrics: [
    "llm_requests_total",
    "llm_cost_total",
    "llm_tokens_total",
    "llm_latency_seconds",
  ],
});

agent.use(exporter);

// Grafana dashboard pronto para usar
```

### Exemplo Completo

```typescript
import { createAgent } from "mcp-agent-kit";

const agent = createAgent({
  provider: "openai",
  model: "gpt-4-turbo-preview",

  costTracking: {
    enabled: true,
    budget: {
      monthly: 100.0,
      daily: 5.0,
    },
    alerts: {
      thresholds: [0.8, 0.9, 1.0],
      onThresholdReached: async (usage) => {
        // Send to Slack
        await fetch("https://hooks.slack.com/...", {
          method: "POST",
          body: JSON.stringify({
            text: `⚠️ AI Budget Alert: ${usage.percentage}% used ($${usage.used}/$${usage.limit})`,
          }),
        });

        // Send email
        await sendEmail({
          to: "team@company.com",
          subject: "AI Budget Alert",
          body: `Current usage: $${usage.used}`,
        });
      },
    },
    actions: {
      onBudgetExceeded: "throttle",
      throttleRate: 0.3, // Reduz para 30%
    },
    export: {
      format: "json",
      destination: "./costs/daily.json",
      interval: "daily",
    },
  },
});

// Usar normalmente
const response = await agent.chat("Hello");

// Verificar custos
const costs = agent.getCosts();
console.log(`Total spent: $${costs.total}`);
console.log(
  `Budget remaining: $${
    costs.budgetStatus.monthly.limit - costs.budgetStatus.monthly.used
  }`
);

// Projeção
const projection = agent.projectCosts({
  period: "month",
  basedOn: "last7days",
});
console.log(`Estimated monthly cost: $${projection.estimated}`);
console.log(`Recommendation: ${projection.recommendation}`);

// Otimizar custos
if (projection.estimated > 80) {
  // Switch to cheaper model
  agent.updateConfig({
    model: "gpt-3.5-turbo",
  });
  console.log("Switched to cheaper model to stay within budget");
}
```

### Relatório Mensal Automático

```typescript
// Gera relatório no final do mês
agent.on("monthEnd", async (report) => {
  const pdf = await generatePDFReport(report);
  await sendEmail({
    to: "finance@company.com",
    subject: "AI Costs - Monthly Report",
    attachments: [pdf],
    body: `
      Total Spent: $${report.total}
      Requests: ${report.requests}
      Most Expensive Day: ${report.peakDay} ($${report.peakCost})
      Recommendations: ${report.recommendations.join(", ")}
    `,
  });
});
```

## 📊 Benefícios

1. **Visibilidade Total**: Sabe exatamente quanto está gastando
2. **Controle**: Previne surpresas na fatura
3. **Otimização**: Identifica oportunidades de economia
4. **Compliance**: Relatórios para finance/management
5. **Peace of Mind**: Dorme tranquilo sabendo que há limites

## 🎯 Casos de Uso

### Startup com Budget Limitado

```typescript
const agent = createAgent({
  costTracking: {
    budget: { monthly: 50 },
    actions: { onBudgetExceeded: "block" },
  },
});
// Garante que não gasta mais que $50/mês
```

### Empresa com Múltiplos Times

```typescript
const teamAgents = {
  engineering: createAgent({ costTracking: { budget: { monthly: 500 } } }),
  marketing: createAgent({ costTracking: { budget: { monthly: 200 } } }),
  support: createAgent({ costTracking: { budget: { monthly: 300 } } }),
};
// Cada time tem seu próprio budget
```

### Desenvolvimento vs Produção

```typescript
const devAgent = createAgent({
  costTracking: {
    budget: { daily: 1 }, // Apenas $1/dia em dev
    actions: { onBudgetExceeded: "warn" },
  },
});

const prodAgent = createAgent({
  costTracking: {
    budget: { daily: 100 },
    actions: { onBudgetExceeded: "throttle" },
  },
});
```

## 🚀 Implementação

### Fase 1: Core (1 semana)

- [ ] Cost calculation engine
- [ ] Budget tracking
- [ ] Basic alerts

### Fase 2: Advanced (1 semana)

- [ ] Projections
- [ ] Throttling
- [ ] Export formats

### Fase 3: Dashboard (1 semana)

- [ ] Web dashboard
- [ ] Charts & visualizations
- [ ] Prometheus integration

---

**Esta feature é essencial para adoção enterprise e pode ser um diferencial competitivo significativo.**
