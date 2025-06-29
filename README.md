# Otobüs Filosu ve Sefer Optimizasyon Sistemi

Bu proje, bir toplu taşıma işletmesi için **karar destek sistemi** olarak tasarlanmış kapsamlı bir web uygulamasıdır. Sistemin temel amacı, operasyonel verimliliği en üst düzeye çıkarırken maliyetleri ve çevresel etkiyi en aza indirmektir. Bunu iki ana optimizasyon adımıyla gerçekleştirir: **Stratejik Filo Planlaması** ve **Operasyonel Sefer Planlaması**.

---

### **1. Hedefler**

*   **Maliyet Minimizasyonu:** Farklı otobüs tiplerinin (minibüs, solo, körüklü) yakıt, bakım, amortisman ve şoför maliyetlerini dikkate alarak her bir hat için en ucuz filo kompozisyonunu bulmak.
*   **Talep Karşılama:** Belirlenen saat aralıklarında (özellikle zirve saatlerde) tüm hatlardaki yolcu talebini eksiksiz karşılayacak yeterli kapasiteyi sağlamak.
*   **Operasyonel Verimlilik:** Otobüslerin atıl bekleme sürelerini en aza indirmek. Bunu, bir otobüsün birden fazla hatta çalışabilmesini sağlayan **"interlining" (hat birleştirme)** optimizasyonu ile başarmak.
*   **Çevresel Etki Analizi:** Seçilen otobüs tiplerine ve sefer planlarına göre toplam karbon emisyonunu hesaplamak ve toplu taşımanın çevresel faydasını (karbon tasarrufunu) göstermek.

### **2. Sistem Mimarisi ve Yapısı**

Uygulama, modern web teknolojileri üzerine inşa edilmiştir:

*   **Frontend:** Next.js (React framework'ü) ile geliştirilmiştir. Bu, hem sunucu taraflı render etme (SSR) hem de istemci taraflı dinamik etkileşimler için güçlü bir temel sağlar.
*   **Dil:** Tutarlı ve hatasız kod geliştirmek için TypeScript kullanılmıştır.
*   **UI (Kullanıcı Arayüzü):** `shadcn/ui` bileşen kütüphanesi ile modern ve kullanışlı bir arayüz oluşturulmuştur. Arayüz, kullanıcıyı adım adım yönlendiren sekmeli (tab) bir yapıya sahiptir (`Parametreler`, `Otobüs Optimizasyonu`, `Sefer Planlama`, `Sonuçlar`).
*   **State Management (Durum Yönetimi):** `React Context` (`bus-optimization-context.tsx`) aracılığıyla uygulama genelindeki tüm veriler (hat bilgileri, otobüs parametreleri, optimizasyon sonuçları vb.) merkezi olarak yönetilir. Bu, bileşenler arasında temiz bir veri akışı sağlar.
*   **Çekirdek Mantık:** Optimizasyon algoritmaları, arayüzden tamamen soyutlanmış bir şekilde `lib/` klasöründe bulunur. Bu, kodun bakımını ve test edilebilirliğini kolaylaştırır.

### **3. Çalışma Mantığı ve Algoritmalar**

Sistem, kullanıcıyı mantıksal bir iş akışı boyunca yönlendirir:

1.  **Adım 1: Veri Girişi (`Parametreler` sekmesi):** Kullanıcı, optimizasyon için gerekli temel verileri girer:
    *   **Hat Bilgileri:** Hat numarası, adı, farklı yönlerdeki uzunlukları, seyahat süreleri ve zirve saatlerdeki yolcu sayıları.
    *   **Otobüs Parametreleri:** Her otobüs tipi (minibüs, solo, körüklü) için kapasite, filo sayısı, km başına maliyetler (yakıt, bakım, amortisman) ve karbon emisyonu.
    *   **Diğer Parametreler:** Şoför maliyeti ve denenecek maksimum hat birleştirme (interlining) seviyesi.

2.  **Adım 2: Otobüs Tipi Optimizasyonu (`lib/optimization.ts`):**
    *   **Algoritma:** Bu modül, her bir hat için bağımsız olarak çalışır. Belirlenen yolcu talebini karşılamak için olası tüm otobüs tipi kombinasyonlarını (örneğin 1 minibüs + 2 solo, 0 minibüs + 1 körüklü vb.) dener.
    *   **Amaç:** Her kombinasyon için toplam maliyeti hesaplar ve en düşük maliyetli olanı "en iyi çözüm" olarak seçer. Bu, **stratejik** bir karardır: "Bu hattın talebini en ucuza hangi otobüslerle karşılarım?" sorusuna cevap verir.
    *   **Çıktı:** Her hat için gereken minibüs, solo ve körüklü otobüs sayısı.

3.  **Adım 3: Sefer Planlama Optimizasyonu (`lib/schedule-optimization.ts`):**
    *   **Algoritma:** Bu modül, ilk adımdaki "kaç tane otobüs lazım?" sorusunun cevabını alır ve "bu otobüsler tam olarak ne zaman, nereden kalkacak?" sorusunu cevaplar. Bir **sezgisel (heuristic)** planlama algoritması kullanır.
    *   **İnovasyon (Interlining):** Algoritmanın en güçlü yanı, hat birleştirmeyi denemesidir. `maxInterlining` parametresini 0'dan başlayarak artırır. Her seviye için bir sefer planı oluşturur ve toplam operasyon maliyetini hesaplar. Maliyetin en düşük olduğu `interlining` seviyesini optimum olarak belirler. Bu, otobüslerin duraklarda boş beklemesi yerine farklı hatlarda sürekli çalışmasını sağlayarak verimliliği artırır.
    *   **Çıktı:** Detaylı sefer çizelgeleri, otobüs kullanım oranları ve her otobüsün hangi hatlarda çalıştığını gösteren detaylı bir operasyonel plan.

4.  **Adım 4: Sonuçların Gösterimi (`Sonuçlar` sekmesi):**
    *   Tüm optimizasyon sonuçları, tablolar ve grafikler kullanılarak kullanıcıya sunulur. Bu çıktılar arasında toplam maliyetler, kilometre başına maliyet, yolcu başına maliyet, toplam karbon emisyonu ve tahmini karbon tasarrufu gibi **Anahtar Performans Göstergeleri (KPI)** bulunur.

Özetle, projeniz bir toplu taşıma yöneticisinin karmaşık planlama problemlerini çözmesine yardımcı olan, veriye dayalı kararlar almasını sağlayan güçlü bir simülasyon ve optimizasyon aracıdır.