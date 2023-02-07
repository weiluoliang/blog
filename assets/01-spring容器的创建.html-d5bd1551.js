import{_ as n,V as s,W as a,X as t}from"./framework-fdd96744.js";const e={},o=t(`<h2 id="内容大纲" tabindex="-1"><a class="header-anchor" href="#内容大纲" aria-hidden="true">#</a> 内容大纲</h2><ol><li>容器的创建</li><li>读取器的创建</li><li>扫描器的创建</li><li>小结</li><li>补充说明 <ol><li>BeanPostProcessor</li><li>Spring中容器的属性说明</li></ol></li></ol><h2 id="一、容器的创建" tabindex="-1"><a class="header-anchor" href="#一、容器的创建" aria-hidden="true">#</a> 一、容器的创建</h2><p>下面我们从容器的创建开始，逐步探索Spring的源码<br> 函数的入口</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code> <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 创建容器</span>
    <span class="token class-name">AnnotationConfigApplicationContext</span> annotationConfigApplicationContext <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">AnnotationConfigApplicationContext</span><span class="token punctuation">(</span><span class="token class-name">AppConfig</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 从容器中获取Bean</span>
    <span class="token class-name">IndexDao</span> dao <span class="token operator">=</span> annotationConfigApplicationContext<span class="token punctuation">.</span><span class="token function">getBean</span><span class="token punctuation">(</span><span class="token class-name">IndexDao</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 调用Bean的方法</span>
    dao<span class="token punctuation">.</span><span class="token function">query</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里主要看 <code>AnnotationConfigApplicationContext</code> 这个类的构造函数</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token class-name">AnnotationConfigApplicationContext</span><span class="token punctuation">(</span><span class="token class-name">Class</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token operator">?</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> annotatedClasses<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 这里由于它有父类构造方法，故而先调用父类的构造方法，然后才会调用自己的构造方法</span>
    <span class="token keyword">this</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">register</span><span class="token punctuation">(</span>annotatedClasses<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">refresh</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>父类是 <code>GenericApplicationContext</code>,构造函数如下</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token class-name">GenericApplicationContext</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 创建一个DefaultListableBeanFactory工厂</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>beanFactory <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">DefaultListableBeanFactory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><blockquote><p>对于 DefaultListableBeanFactory ， 我们可以把它当成一个Spring容器</p></blockquote><p>再看一下<code>AnnotationConfigApplicationContext</code> 这个类的无参构造函数 ,因为上面的函数调用了<code>this</code>.</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code>    <span class="token comment">// 创建一个 AnnotatedBeanDefinitionReader读取器，</span>
    <span class="token comment">// 同时向容器中填加了6个Spring的后置处理器：BeanFactoryPostProcessor、BeanPostProcessor</span>
    <span class="token comment">// 1. ConfigurationClassPostProcessor</span>
		<span class="token comment">// 2. AutowiredAnnotationBeanPostProcessor</span>
		<span class="token comment">// 3. CommonAnnotationBeanPostProcessor</span>
		<span class="token comment">// 4. PersistenceAnnotationBeanPostProcessor</span>
		<span class="token comment">// 5. EventListenerMethodProcessor</span>
		<span class="token comment">// 6. DefaultEventListenerFactory</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>reader <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">AnnotatedBeanDefinitionReader</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 可以用来扫描包或者类，继而转换成BeanDefinition，但实际上我们扫描包工作不是这个scanner对象来完成的</span>
    <span class="token comment">// 是spring自己new的一个ClassPathBeanDefinitionScanner</span>
    <span class="token comment">// 这里的scanner仅仅是为了能够让程序员在外部调用AnnotationConfigApplicationContext对象的scan方法</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>scanner <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ClassPathBeanDefinitionScanner</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这个无参的构造函数初始化了一个读取器和扫描器 。</p><h2 id="二、读取器的创建" tabindex="-1"><a class="header-anchor" href="#二、读取器的创建" aria-hidden="true">#</a> 二、读取器的创建</h2><p>读取器的创建在<code>AnnotationConfigApplicationContext</code>的无参构造函数中，我们一路追踪下去</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code>  <span class="token comment">// 创建Reader ，当前 this实现了 BeanDefinitionRegistry </span>
  <span class="token keyword">this</span><span class="token punctuation">.</span>reader <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">AnnotatedBeanDefinitionReader</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token comment">// 一路跟代码下去 </span>
  <span class="token keyword">public</span> <span class="token class-name">AnnotatedBeanDefinitionReader</span><span class="token punctuation">(</span><span class="token class-name">BeanDefinitionRegistry</span> registry<span class="token punctuation">)</span> <span class="token punctuation">{</span>
		<span class="token keyword">this</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> <span class="token function">getOrCreateEnvironment</span><span class="token punctuation">(</span>registry<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token punctuation">}</span>

  <span class="token comment">// this(registry, getOrCreateEnvironment(registry));</span>
  <span class="token keyword">public</span> <span class="token class-name">AnnotatedBeanDefinitionReader</span><span class="token punctuation">(</span><span class="token class-name">BeanDefinitionRegistry</span> registry<span class="token punctuation">,</span> <span class="token class-name">Environment</span> environment<span class="token punctuation">)</span> <span class="token punctuation">{</span>
		<span class="token comment">// 省略部分代码 .. </span>
    <span class="token comment">// 最终在AnnotationConfigUtils注册6个后置处理器 BeanFactoryPostProcessor,BeanPostProcessor</span>
		<span class="token class-name">AnnotationConfigUtils</span><span class="token punctuation">.</span><span class="token function">registerAnnotationConfigProcessors</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>registry<span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token punctuation">}</span>

  <span class="token comment">// AnnotationConfigUtils的方法</span>
  <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">registerAnnotationConfigProcessors</span><span class="token punctuation">(</span><span class="token class-name">BeanDefinitionRegistry</span> registry<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 主要逻辑就在这里啦，重点解读这段逻辑</span>
		<span class="token function">registerAnnotationConfigProcessors</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在<code>registerAnnotationConfigProcessors(registry, null)</code>方法中，主要是注册了后置处理器</p><ol><li>ConfigurationClassPostProcessor</li><li>AutowiredAnnotationBeanPostProcessor</li><li>CommonAnnotationBeanPostProcessor</li><li>PersistenceAnnotationBeanPostProcessor (这个是JPA的，一般不使用JPA不会添加)</li><li>EventListenerMethodProcessor</li><li>DefaultEventListenerFactory</li></ol><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">Set</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">BeanDefinitionHolder</span><span class="token punctuation">&gt;</span></span> <span class="token function">registerAnnotationConfigProcessors</span><span class="token punctuation">(</span>
			<span class="token class-name">BeanDefinitionRegistry</span> registry<span class="token punctuation">,</span> <span class="token annotation punctuation">@Nullable</span> <span class="token class-name">Object</span> source<span class="token punctuation">)</span> <span class="token punctuation">{</span>

  <span class="token class-name">DefaultListableBeanFactory</span> beanFactory <span class="token operator">=</span> <span class="token function">unwrapDefaultListableBeanFactory</span><span class="token punctuation">(</span>registry<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>beanFactory <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token punctuation">(</span>beanFactory<span class="token punctuation">.</span><span class="token function">getDependencyComparator</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">instanceof</span> <span class="token class-name">AnnotationAwareOrderComparator</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      beanFactory<span class="token punctuation">.</span><span class="token function">setDependencyComparator</span><span class="token punctuation">(</span><span class="token class-name">AnnotationAwareOrderComparator</span><span class="token punctuation">.</span><span class="token constant">INSTANCE</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token punctuation">(</span>beanFactory<span class="token punctuation">.</span><span class="token function">getAutowireCandidateResolver</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">instanceof</span> <span class="token class-name">ContextAnnotationAutowireCandidateResolver</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      beanFactory<span class="token punctuation">.</span><span class="token function">setAutowireCandidateResolver</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ContextAnnotationAutowireCandidateResolver</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token class-name">Set</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">BeanDefinitionHolder</span><span class="token punctuation">&gt;</span></span> beanDefs <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LinkedHashSet</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token number">8</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 如果没有ConfigurationClassPostProcessor这个BeanDefinition，添加一个</span>
  <span class="token comment">// 很重要，这个是去解析@Configuration，@Import，@Bean，@Component，@Service等生成BeanDefinition</span>
  <span class="token comment">// 在SpringBoot中，@AutoConfiguration中使用了@Import注解，把自动配置类交给ConfigurationClassPostProcessor去解析</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token class-name">ConfigurationClassPostProcessor</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token comment">// AutowiredAnnotationBeanPostProcessor 后置处理器 @Autowired解析</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token class-name">AutowiredAnnotationBeanPostProcessor</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.</span>
  <span class="token comment">// CommonAnnotationBeanPostProcessor 解析@Resource</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>jsr250Present <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">COMMON_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token class-name">CommonAnnotationBeanPostProcessor</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">COMMON_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>jpaPresent <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
      def<span class="token punctuation">.</span><span class="token function">setBeanClass</span><span class="token punctuation">(</span><span class="token class-name">ClassUtils</span><span class="token punctuation">.</span><span class="token function">forName</span><span class="token punctuation">(</span><span class="token constant">PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME</span><span class="token punctuation">,</span>
          <span class="token class-name">AnnotationConfigUtils</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">.</span><span class="token function">getClassLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">ClassNotFoundException</span> ex<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">IllegalStateException</span><span class="token punctuation">(</span>
          <span class="token string">&quot;Cannot load optional framework class: &quot;</span> <span class="token operator">+</span> <span class="token constant">PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME</span><span class="token punctuation">,</span> ex<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">EVENT_LISTENER_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token class-name">EventListenerMethodProcessor</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">EVENT_LISTENER_PROCESSOR_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>registry<span class="token punctuation">.</span><span class="token function">containsBeanDefinition</span><span class="token punctuation">(</span><span class="token constant">EVENT_LISTENER_FACTORY_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">RootBeanDefinition</span> def <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RootBeanDefinition</span><span class="token punctuation">(</span><span class="token class-name">DefaultEventListenerFactory</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    def<span class="token punctuation">.</span><span class="token function">setSource</span><span class="token punctuation">(</span>source<span class="token punctuation">)</span><span class="token punctuation">;</span>
    beanDefs<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token function">registerPostProcessor</span><span class="token punctuation">(</span>registry<span class="token punctuation">,</span> def<span class="token punctuation">,</span> <span class="token constant">EVENT_LISTENER_FACTORY_BEAN_NAME</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">return</span> beanDefs<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="三、扫描器的创建" tabindex="-1"><a class="header-anchor" href="#三、扫描器的创建" aria-hidden="true">#</a> 三、扫描器的创建</h2><h2 id="四、小结" tabindex="-1"><a class="header-anchor" href="#四、小结" aria-hidden="true">#</a> 四、小结</h2><h2 id="五、补充说明" tabindex="-1"><a class="header-anchor" href="#五、补充说明" aria-hidden="true">#</a> 五、补充说明</h2>`,22),p=[o];function c(i,l){return s(),a("div",null,p)}const r=n(e,[["render",c],["__file","01-spring容器的创建.html.vue"]]);export{r as default};
