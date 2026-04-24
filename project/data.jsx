// Sample code per language. Simplified snippets with one deliberate issue for the "Fix an error" flow.

const CODE_SAMPLES = {
  java: {
    file: 'OrderService.java',
    path: 'src/main/java/com/acme/orders/OrderService.java',
    lang: 'Java • Spring Boot',
    lines: [
      { tokens: [['anno','@Service'],] },
      { tokens: [['kw','public class'],['t','  '],['type','OrderService'],['punct',' {']] },
      { tokens: [] },
      { tokens: [['t','    '],['anno','@Autowired']] },
      { tokens: [['t','    '],['kw','private'],['t',' '],['type','OrderRepository'],['t',' '],['var','orderRepository'],['punct',';']] },
      { tokens: [] },
      { tokens: [['t','    '],['anno','@Transactional']] },
      { tokens: [['t','    '],['kw','public'],['t',' '],['type','Order'],['t',' '],['fn','placeOrder'],['punct','('],['type','OrderRequest'],['t',' '],['var','request'],['punct',') {']] },
      { tokens: [['t','        '],['type','Order'],['t',' '],['var','order'],['t',' '],['punct','='],['t',' '],['kw','new'],['t',' '],['type','Order'],['punct','();']] },
      { tokens: [['t','        '],['var','order'],['punct','.'],['fn','setCustomerId'],['punct','('],['var','request'],['punct','.'],['fn','getCustomerId'],['punct','());']] },
      { tokens: [['t','        '],['var','order'],['punct','.'],['fn','setItems'],['punct','('],['var','request'],['punct','.'],['fn','getItems'],['punct','());']] },
      { tokens: [], issue: true },
      { tokens: [['t','        '],['type','BigDecimal'],['t',' '],['var','total'],['t',' '],['punct','='],['t',' '],['var','request'],['punct','.'],['fn','getItems'],['punct','().'],['fn','stream'],['punct','()']], issue: true, lens: 'NullPointerException risk • getItems() may return null' },
      { tokens: [['t','            '],['punct','.'],['fn','map'],['punct','('],['var','Item'],['punct','::'],['fn','getPrice'],['punct',')']] },
      { tokens: [['t','            '],['punct','.'],['fn','reduce'],['punct','('],['type','BigDecimal'],['punct','.'],['var','ZERO'],['punct',', '],['type','BigDecimal'],['punct','::'],['fn','add'],['punct',');']] },
      { tokens: [['t','        '],['var','order'],['punct','.'],['fn','setTotal'],['punct','('],['var','total'],['punct',');']] },
      { tokens: [] },
      { tokens: [['t','        '],['kw','return'],['t',' '],['var','orderRepository'],['punct','.'],['fn','save'],['punct','('],['var','order'],['punct',');']] },
      { tokens: [['t','    '],['punct','}']] },
      { tokens: [['punct','}']] },
    ]
  },
  cs: {
    file: 'OrdersController.cs',
    path: 'src/Api/Controllers/OrdersController.cs',
    lang: 'C# • .NET 8 Web API',
    lines: [
      { tokens: [['anno','[ApiController]']] },
      { tokens: [['anno','[Route'],['punct','('],['str','"api/orders"'],['punct',')]']] },
      { tokens: [['kw','public class'],['t',' '],['type','OrdersController'],['t',' '],['punct',': '],['type','ControllerBase'],['punct',' {']] },
      { tokens: [['t','    '],['kw','private readonly'],['t',' '],['type','IOrderService'],['t',' '],['var','_svc'],['punct',';']] },
      { tokens: [] },
      { tokens: [['t','    '],['anno','[HttpPost]']] },
      { tokens: [['t','    '],['kw','public async'],['t',' '],['type','Task'],['punct','<'],['type','IActionResult'],['punct','> '],['fn','Place'],['punct','('],['type','OrderDto'],['t',' '],['var','dto'],['punct',') {']] },
      { tokens: [['t','        '],['kw','var'],['t',' '],['var','result'],['t',' '],['punct','='],['t',' '],['kw','await'],['t',' '],['var','_svc'],['punct','.'],['fn','PlaceAsync'],['punct','('],['var','dto'],['punct',');']] },
      { tokens: [['t','        '],['kw','return'],['t',' '],['fn','Ok'],['punct','('],['var','result'],['punct',');']] },
      { tokens: [['t','    '],['punct','}']] },
      { tokens: [['punct','}']] },
    ]
  },
  node: {
    file: 'handler.js',
    path: 'src/lambda/orders/handler.js',
    lang: 'AWS Lambda • Node.js 20',
    lines: [
      { tokens: [['kw','const'],['t',' '],['var','AWS'],['t',' '],['punct','='],['t',' '],['fn','require'],['punct','('],['str','\'aws-sdk\''],['punct',');']] },
      { tokens: [['kw','const'],['t',' '],['var','dynamo'],['t',' '],['punct','='],['t',' '],['kw','new'],['t',' '],['var','AWS'],['punct','.'],['type','DynamoDB'],['punct','.'],['type','DocumentClient'],['punct','();']] },
      { tokens: [] },
      { tokens: [['kw','exports'],['punct','.'],['var','handler'],['t',' '],['punct','='],['t',' '],['kw','async'],['t',' '],['punct','('],['var','event'],['punct',') => {']] },
      { tokens: [['t','  '],['kw','const'],['t',' '],['var','body'],['t',' '],['punct','='],['t',' '],['var','JSON'],['punct','.'],['fn','parse'],['punct','('],['var','event'],['punct','.'],['var','body'],['punct',');']] },
      { tokens: [['t','  '],['kw','const'],['t',' '],['var','result'],['t',' '],['punct','='],['t',' '],['kw','await'],['t',' '],['var','dynamo'],['punct','.'],['fn','put'],['punct','({']] },
      { tokens: [['t','    '],['var','TableName'],['punct',': '],['str','\'Orders\''],['punct',',']] },
      { tokens: [['t','    '],['var','Item'],['punct',': '],['var','body']] },
      { tokens: [['t','  '],['punct','}).'],['fn','promise'],['punct','();']] },
      { tokens: [['t','  '],['kw','return'],['t',' '],['punct','{ '],['var','statusCode'],['punct',': '],['num','200'],['punct',', '],['var','body'],['punct',': '],['var','JSON'],['punct','.'],['fn','stringify'],['punct','('],['var','result'],['punct',') };']] },
      { tokens: [['punct','};']] },
    ]
  },
  az: {
    file: 'OrderFunction.cs',
    path: 'src/Functions/OrderFunction.cs',
    lang: 'Azure Functions • C# isolated',
    lines: [
      { tokens: [['kw','public class'],['t',' '],['type','OrderFunction'],['punct',' {']] },
      { tokens: [['t','    '],['anno','[Function'],['punct','('],['str','"PlaceOrder"'],['punct',')]']] },
      { tokens: [['t','    '],['kw','public'],['t',' '],['type','HttpResponseData'],['t',' '],['fn','Run'],['punct','(']] },
      { tokens: [['t','        '],['anno','[HttpTrigger'],['punct','('],['var','AuthorizationLevel'],['punct','.'],['var','Function'],['punct',', '],['str','"post"'],['punct',')] '],['type','HttpRequestData'],['t',' '],['var','req'],['punct',') {']] },
      { tokens: [['t','        '],['kw','var'],['t',' '],['var','response'],['t',' '],['punct','='],['t',' '],['var','req'],['punct','.'],['fn','CreateResponse'],['punct','('],['var','HttpStatusCode'],['punct','.'],['var','OK'],['punct',');']] },
      { tokens: [['t','        '],['var','response'],['punct','.'],['fn','WriteString'],['punct','('],['str','"Order placed"'],['punct',');']] },
      { tokens: [['t','        '],['kw','return'],['t',' '],['var','response'],['punct',';']] },
      { tokens: [['t','    '],['punct','}']] },
      { tokens: [['punct','}']] },
    ]
  }
};

const ACTIVITIES = [
  { id: 'fix',     label: 'Fix error',     icon: 'Wrench',  badge: 'fix',     color: 'danger' },
  { id: 'improve', label: 'Improve',       icon: 'Sparkle', badge: 'improve', color: 'accent' },
  { id: 'refactor',label: 'Refactor',      icon: 'Bolt',    badge: 'improve', color: 'accent' },
  { id: 'secure',  label: 'Security review',icon: 'Shield', badge: 'sec',     color: 'accent' },
  { id: 'tests',   label: 'Generate tests',icon: 'Flask',   badge: 'improve', color: 'accent' },
  { id: 'explain', label: 'Explain',       icon: 'Book',    badge: 'improve', color: 'accent' },
];

// Suggestion packs — varies per activity, and contextual to the Java sample.
const SUGGESTIONS = {
  fix: [
    {
      id: 's1', badge: 'fix', title: 'Guard against null items',
      desc: 'OrderRequest.getItems() may return null when deserialized from a request with no items field. Use Optional.ofNullable and an empty stream fallback.',
      impact: 'Fixes NPE on line 13', confidence: 98, files: 1,
    },
    {
      id: 's2', badge: 'fix', title: 'Validate request at controller',
      desc: 'Add @Valid on the controller parameter and @NotNull on OrderRequest.items so malformed requests are rejected earlier with a 400.',
      impact: '1 file, 6 lines', confidence: 84, files: 2,
    },
    {
      id: 's3', badge: 'fix', title: 'Return 422 on empty cart',
      desc: 'Throw EmptyCartException → maps to 422 via GlobalExceptionHandler. Keeps domain rules out of the stream pipeline.',
      impact: 'Behavioral', confidence: 72, files: 2,
    }
  ],
  improve: [
    { id: 's1', badge: 'improve', title: 'Extract total calculation', desc: 'Pull the BigDecimal reduction into OrderTotal.from(items) — unit-testable, reusable across OrderService and InvoiceService.', impact: 'Readability', confidence: 92, files: 1 },
    { id: 's2', badge: 'perf',    title: 'Batch save with saveAll()', desc: 'placeOrder() persists items one-by-one via cascade. Use orderItemRepo.saveAll(items) to cut DB round-trips from N+1 → 2.', impact: 'Perf', confidence: 88, files: 1 },
    { id: 's3', badge: 'improve', title: 'Use constructor injection', desc: 'Replace @Autowired field with a final field populated by a constructor — testable without reflection.', impact: 'Style', confidence: 95, files: 1 },
  ],
  refactor: [
    { id: 's1', badge: 'improve', title: 'Split into command + query', desc: 'PlaceOrderCommand handles the write path; GetOrderQuery handles reads. Current OrderService is doing both.', impact: '3 files', confidence: 78, files: 3 },
    { id: 's2', badge: 'improve', title: 'Replace setters with builder', desc: 'Order.builder().customerId(…).items(…).total(…).build() — immutable Order, clearer call sites.', impact: 'Readability', confidence: 86, files: 2 },
  ],
  secure: [
    { id: 's1', badge: 'sec', title: 'Authorize customer ownership', desc: 'Controller does not check that request.customerId matches the authenticated principal. Add @PreAuthorize("#req.customerId == principal.id").', impact: 'Critical', confidence: 94, files: 1 },
    { id: 's2', badge: 'sec', title: 'Mask PII in logs', desc: 'Order is logged at DEBUG with full customer address. Wrap with a LoggingRedactor or use @JsonIgnore on PII fields.', impact: 'High', confidence: 81, files: 2 },
  ],
  tests: [
    { id: 's1', badge: 'improve', title: 'Unit tests — happy path + 3 edge cases', desc: 'placeOrder: valid cart, empty items, null items, negative quantity. Mockito for the repository.', impact: 'Coverage +42%', confidence: 96, files: 1 },
    { id: 's2', badge: 'improve', title: 'Integration test with @DataJpaTest', desc: 'Round-trip against H2 to verify cascade + total persistence. Slower but catches JPA mapping regressions.', impact: 'Coverage +15%', confidence: 88, files: 1 },
  ],
  explain: [
    { id: 's1', badge: 'improve', title: 'Line-by-line walkthrough', desc: 'Annotated explanation of what each statement does and why @Transactional is placed at the method level.', impact: 'Docs', confidence: 99, files: 0 },
  ],
};

// Diff data for the selected "fix items null" suggestion.
const DIFF = {
  before: [
    { n: 12, c: '        BigDecimal total = request.getItems().stream()' },
    { n: 13, c: '            .map(Item::getPrice)' },
    { n: 14, c: '            .reduce(BigDecimal.ZERO, BigDecimal::add);', del: true },
  ],
  after: [
    { n: 12, c: '        List<Item> items = Optional.ofNullable(request.getItems())', add: true },
    { n: 13, c: '            .orElseGet(Collections::emptyList);', add: true },
    { n: 14, c: '        BigDecimal total = items.stream()', add: true },
    { n: 15, c: '            .map(Item::getPrice)' },
    { n: 16, c: '            .reduce(BigDecimal.ZERO, BigDecimal::add);' },
  ],
  beforeFull: [
    { n: 10, c: '        order.setCustomerId(request.getCustomerId());' },
    { n: 11, c: '        order.setItems(request.getItems());' },
    { n: 12, c: '        BigDecimal total = request.getItems().stream()', del: true },
    { n: 13, c: '            .map(Item::getPrice)' },
    { n: 14, c: '            .reduce(BigDecimal.ZERO, BigDecimal::add);' },
    { n: 15, c: '        order.setTotal(total);' },
  ],
  afterFull: [
    { n: 10, c: '        order.setCustomerId(request.getCustomerId());' },
    { n: 11, c: '        order.setItems(request.getItems());' },
    { n: 12, c: '        List<Item> items = Optional.ofNullable(request.getItems())', add: true },
    { n: 13, c: '            .orElseGet(Collections::emptyList);', add: true },
    { n: 14, c: '        BigDecimal total = items.stream()', add: true },
    { n: 15, c: '            .map(Item::getPrice)' },
    { n: 16, c: '            .reduce(BigDecimal.ZERO, BigDecimal::add);' },
    { n: 17, c: '        order.setTotal(total);' },
  ],
  added: 4, removed: 1
};

// Generated test code (shown typing line-by-line).
const GENERATED_TESTS = [
  '@ExtendWith(MockitoExtension.class)',
  'class OrderServiceTest {',
  '',
  '    @Mock OrderRepository orderRepository;',
  '    @InjectMocks OrderService orderService;',
  '',
  '    @Test',
  '    void placeOrder_computesTotal_forValidCart() {',
  '        OrderRequest req = new OrderRequest(1L, List.of(',
  '            new Item("SKU-1", new BigDecimal("9.99")),',
  '            new Item("SKU-2", new BigDecimal("4.50"))));',
  '        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));',
  '',
  '        Order result = orderService.placeOrder(req);',
  '',
  '        assertThat(result.getTotal()).isEqualByComparingTo("14.49");',
  '    }',
  '',
  '    @Test',
  '    void placeOrder_handlesNullItems_withoutThrowing() {',
  '        OrderRequest req = new OrderRequest(1L, null);',
  '        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));',
  '',
  '        Order result = orderService.placeOrder(req);',
  '',
  '        assertThat(result.getTotal()).isEqualByComparingTo("0");',
  '    }',
  '',
  '    @Test',
  '    void placeOrder_returnsZero_forEmptyItems() {',
  '        OrderRequest req = new OrderRequest(1L, List.of());',
  '        Order result = orderService.placeOrder(req);',
  '        assertThat(result.getTotal()).isEqualByComparingTo("0");',
  '    }',
  '}',
];

const TEST_CASES = [
  { name: 'placeOrder_computesTotal_forValidCart', time: '42ms' },
  { name: 'placeOrder_handlesNullItems_withoutThrowing', time: '8ms' },
  { name: 'placeOrder_returnsZero_forEmptyItems', time: '5ms' },
  { name: 'placeOrder_savesToRepository', time: '11ms' },
  { name: 'placeOrder_appliesTransactional', time: '6ms' },
  { name: 'placeOrder_rejectsNegativePrice', time: '9ms' },
];

const PROJECTS = [
  { id: 'orders-api',    name: 'orders-api',         branch: 'main',      lang: 'java', langLabel: 'Java', meta: 'Updated 2h ago', issues: 3, status: 'y' },
  { id: 'billing-svc',   name: 'billing-service',    branch: 'feat/refunds', lang: 'cs', langLabel: 'C#', meta: 'Updated yesterday', issues: 0, status: 'g' },
  { id: 'notify-lambda', name: 'notify-lambda',      branch: 'main',      lang: 'node', langLabel: 'Node', meta: '3 days ago', issues: 1, status: 'g' },
  { id: 'tax-fn',        name: 'tax-functions',      branch: 'main',      lang: 'az',   langLabel: 'Az',  meta: '5 days ago', issues: 2, status: 'y' },
  { id: 'etl-scripts',   name: 'etl-scripts',        branch: 'main',      lang: 'py',   langLabel: 'Py',  meta: '2 weeks ago', issues: 0, status: 'g' },
  { id: 'payments-api',  name: 'payments-api',       branch: 'hotfix/timeout', lang: 'java', langLabel: 'Java', meta: '3 weeks ago', issues: 5, status: 'r' },
];

const FILE_TREE = {
  folders: [
    { name: 'src', open: true, children: [
      { name: 'main', open: true, children: [
        { name: 'java', open: true, children: [
          { name: 'com.acme.orders', open: true, children: [
            { name: 'OrderService.java', file: true, active: true, modified: true },
            { name: 'OrderController.java', file: true },
            { name: 'OrderRepository.java', file: true },
            { name: 'Order.java', file: true },
            { name: 'OrderRequest.java', file: true },
          ]},
        ]},
        { name: 'resources', children: [
          { name: 'application.yml', file: true },
        ]}
      ]},
      { name: 'test', children: [
        { name: 'java', children: [
          { name: 'OrderServiceTest.java', file: true, modified: true },
        ]}
      ]},
    ]},
    { name: 'pom.xml', file: true },
    { name: 'Dockerfile', file: true },
    { name: 'README.md', file: true },
  ]
};

window.CODE_SAMPLES = CODE_SAMPLES;
window.ACTIVITIES = ACTIVITIES;
window.SUGGESTIONS = SUGGESTIONS;
window.DIFF = DIFF;
window.GENERATED_TESTS = GENERATED_TESTS;
window.TEST_CASES = TEST_CASES;
window.PROJECTS = PROJECTS;
window.FILE_TREE = FILE_TREE;
