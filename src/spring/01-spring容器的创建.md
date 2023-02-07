---
title: 'Spring源码系列（一）——容器的创建'
icon: page
order: 1
author: luoliang
date: 2023-01-28
category:
  - spring
tag:
  - 源码
sticky: false
star: true
footer: false
copyright: No Copyright
editLink: false
comment: false
sidebar: false
---

## 内容大纲
 1. 容器的创建  
 2. 读取器的创建  
 3. 扫描器的创建  
 4. 小结  
 5. 补充说明  
    1. BeanPostProcessor
    2. Spring中容器的属性说明


## 一、容器的创建
下面我们从容器的创建开始，逐步探索Spring的源码  
函数的入口
```java
 public static void main(String[] args) {
    // 创建容器
    AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(AppConfig.class);

    // 从容器中获取Bean
    IndexDao dao = annotationConfigApplicationContext.getBean(IndexDao.class);

    // 调用Bean的方法
    dao.query();
}
```
这里主要看 `AnnotationConfigApplicationContext` 这个类的构造函数
```java
public AnnotationConfigApplicationContext(Class<?>... annotatedClasses) {
    // 这里由于它有父类构造方法，故而先调用父类的构造方法，然后才会调用自己的构造方法
    this();
    register(annotatedClasses);
    refresh();
}
```
父类是 `GenericApplicationContext`,构造函数如下
```java
public GenericApplicationContext() {
    // 创建一个DefaultListableBeanFactory工厂
    this.beanFactory = new DefaultListableBeanFactory();
}
```
> 对于 DefaultListableBeanFactory ， 我们可以把它当成一个Spring容器

再看一下`AnnotationConfigApplicationContext` 这个类的无参构造函数 ,因为上面的函数调用了`this`.
```java
    // 创建一个 AnnotatedBeanDefinitionReader读取器，
    // 同时向容器中填加了6个Spring的后置处理器：BeanFactoryPostProcessor、BeanPostProcessor
    // 1. ConfigurationClassPostProcessor
		// 2. AutowiredAnnotationBeanPostProcessor
		// 3. CommonAnnotationBeanPostProcessor
		// 4. PersistenceAnnotationBeanPostProcessor
		// 5. EventListenerMethodProcessor
		// 6. DefaultEventListenerFactory
    this.reader = new AnnotatedBeanDefinitionReader(this);

    // 可以用来扫描包或者类，继而转换成BeanDefinition，但实际上我们扫描包工作不是这个scanner对象来完成的
    // 是spring自己new的一个ClassPathBeanDefinitionScanner
    // 这里的scanner仅仅是为了能够让程序员在外部调用AnnotationConfigApplicationContext对象的scan方法
    this.scanner = new ClassPathBeanDefinitionScanner(this);
```
这个无参的构造函数初始化了一个读取器和扫描器 。 

## 二、读取器的创建
读取器的创建在`AnnotationConfigApplicationContext`的无参构造函数中，我们一路追踪下去
```java
  // 创建Reader ，当前 this实现了 BeanDefinitionRegistry 
  this.reader = new AnnotatedBeanDefinitionReader(this);

  // 一路跟代码下去 
  public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry) {
		this(registry, getOrCreateEnvironment(registry));
	}

  // this(registry, getOrCreateEnvironment(registry));
  public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry, Environment environment) {
		// 省略部分代码 .. 
    // 最终在AnnotationConfigUtils注册6个后置处理器 BeanFactoryPostProcessor,BeanPostProcessor
		AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
	}

  // AnnotationConfigUtils的方法
  public static void registerAnnotationConfigProcessors(BeanDefinitionRegistry registry) {
    // 主要逻辑就在这里啦，重点解读这段逻辑
		registerAnnotationConfigProcessors(registry, null);
	}
```
在`registerAnnotationConfigProcessors(registry, null)`方法中，主要是注册了后置处理器
 1. ConfigurationClassPostProcessor
 2. AutowiredAnnotationBeanPostProcessor
 3. CommonAnnotationBeanPostProcessor
 4. PersistenceAnnotationBeanPostProcessor (这个是JPA的，一般不使用JPA不会添加)
 5. EventListenerMethodProcessor 
 6. DefaultEventListenerFactory 

```java
public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
			BeanDefinitionRegistry registry, @Nullable Object source) {

  DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
  if (beanFactory != null) {
    if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
      beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE);
    }
    if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
      beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
    }
  }

  Set<BeanDefinitionHolder> beanDefs = new LinkedHashSet<>(8);
  // 如果没有ConfigurationClassPostProcessor这个BeanDefinition，添加一个
  // 很重要，这个是去解析@Configuration，@Import，@Bean，@Component，@Service等生成BeanDefinition
  // 在SpringBoot中，@AutoConfiguration中使用了@Import注解，把自动配置类交给ConfigurationClassPostProcessor去解析
  if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
  }
  // AutowiredAnnotationBeanPostProcessor 后置处理器 @Autowired解析
  if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
  }

  // Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
  // CommonAnnotationBeanPostProcessor 解析@Resource
  if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
  }

  // Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
  if (jpaPresent && !registry.containsBeanDefinition(PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition();
    try {
      def.setBeanClass(ClassUtils.forName(PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME,
          AnnotationConfigUtils.class.getClassLoader()));
    }
    catch (ClassNotFoundException ex) {
      throw new IllegalStateException(
          "Cannot load optional framework class: " + PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME, ex);
    }
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME));
  }
  
  if (!registry.containsBeanDefinition(EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition(EventListenerMethodProcessor.class);
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_PROCESSOR_BEAN_NAME));
  }

  if (!registry.containsBeanDefinition(EVENT_LISTENER_FACTORY_BEAN_NAME)) {
    RootBeanDefinition def = new RootBeanDefinition(DefaultEventListenerFactory.class);
    def.setSource(source);
    beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_FACTORY_BEAN_NAME));
  }

  return beanDefs;
}
```


## 三、扫描器的创建

## 四、小结

## 五、补充说明




