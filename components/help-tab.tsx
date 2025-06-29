"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bus,
  Calculator,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  FileQuestion,
  FileText,
  Settings,
  BarChart3,
  Clock,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HelpTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        <h2 className="text-xl font-semibold">Optimizasyon Modeli Yardım Kılavuzu</h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <FileQuestion className="h-4 w-4" />
            <span>Genel Bakış</span>
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Adımlar</span>
          </TabsTrigger>
          <TabsTrigger value="algorithm" className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" />
            <span>Algoritma</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            <span>SSS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Entegre Optimizasyon Modeli Nedir?
              </CardTitle>
              <CardDescription>
                Otobüs tipi atama ve sefer çizelgesi oluşturan entegre bir optimizasyon modeli
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Modelin Amacı
                  </h3>
                  <p className="text-muted-foreground">
                    Bu entegre optimizasyon modeli, iki aşamalı bir yaklaşım kullanır. İlk olarak, her hat için yolcu
                    talebine göre en uygun otobüs tiplerini belirler. Ardından, belirlenen otobüs tipleri için gidiş ve
                    dönüş sürelerini dikkate alarak optimal sefer çizelgeleri oluşturur. Model, toplam maliyeti minimize
                    ederken, yolcu talebini karşılamayı ve çevresel etkileri de göz önünde bulundurur.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
                  <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-teal-100 p-2 rounded-full">
                        <Bus className="h-5 w-5 text-teal-600" />
                      </div>
                      <h3 className="text-base font-medium">Otobüs Tipi Optimizasyonu</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Yolcu talebine göre en uygun otobüs tiplerini (midibüs, solo, körüklü) belirler ve toplam maliyeti
                      minimize eder.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
                  <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-base font-medium">Sefer Çizelgesi Optimizasyonu</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Belirlenen otobüs tipleri için gidiş ve dönüş sürelerini dikkate alarak optimal sefer çizelgeleri
                      oluşturur.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-blue-400/10 to-gray-400/20 p-[1px] shadow-md">
                  <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-base font-medium">Entegre Sonuçlar</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Otobüs tipi ve sefer çizelgesi optimizasyonlarının sonuçlarını birleştirerek kapsamlı bir analiz
                      sunar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Modelin Faydaları
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Toplam işletme maliyetlerinin azaltılması</li>
                    <li>Kapasite kullanımının optimize edilmesi</li>
                    <li>Yakıt tüketiminin ve çevresel etkinin azaltılması</li>
                    <li>Farklı yönlerdeki seyahat sürelerini dikkate alarak daha gerçekçi çizelgeler oluşturulması</li>
                    <li>Filo kaynaklarının daha verimli kullanılması</li>
                    <li>Karbon emisyonunun azaltılması ve çevresel sürdürülebilirliğin desteklenmesi</li>
                    <li>Veri odaklı karar verme süreçlerinin desteklenmesi</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Optimizasyon Adımları
              </CardTitle>
              <CardDescription>Modeli kullanmak için izlemeniz gereken adımlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full w-8 h-8 mt-0.5 flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-teal-600" />
                          Parametreleri Ayarlama
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Parametreler sekmesinde, her otobüs tipi için kapasite, maliyet ve filo büyüklüğü gibi
                          değerleri ayarlayın.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full w-8 h-8 mt-0.5 flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1 flex items-center gap-2">
                          <Bus className="h-4 w-4 text-teal-600" />
                          Otobüs Tipi Optimizasyonu
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Otobüs Tipi sekmesinde, hat verilerini yükleyin ve her hat için en uygun otobüs tiplerini
                          belirleyin.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full w-8 h-8 mt-0.5 flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-teal-600" />
                          Sefer Çizelgesi Optimizasyonu
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Sefer Çizelgesi sekmesinde, gidiş ve dönüş sürelerini belirleyin ve optimal sefer
                          çizelgelerini oluşturun.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full w-8 h-8 mt-0.5 flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-teal-600" />
                          Sonuçları İnceleme
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Sonuçlar sekmesinde, optimizasyon sonuçlarını inceleyebilir, filtreleyebilir ve Excel'e
                          aktarabilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-amber-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Dikkat Edilmesi Gerekenler
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Filodaki otobüs sayısı, tüm hatların talebini karşılamak için yeterli olmalıdır.</li>
                    <li>Gidiş ve dönüş süreleri doğru şekilde belirlenmelidir.</li>
                    <li>Zirve saat yolcu sayıları gerçekçi ve güncel olmalıdır.</li>
                    <li>Hat uzunlukları doğru ölçülmelidir, çünkü maliyet hesaplamalarında önemli rol oynar.</li>
                    <li>CSV dosyaları UTF-8 formatında olmalı ve gerekli tüm sütunları içermelidir.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithm">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Optimizasyon Algoritması
              </CardTitle>
              <CardDescription>Modelin çalışma mantığı ve matematiksel temelleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <h3 className="text-lg font-medium mb-2">İki Aşamalı Optimizasyon Yaklaşımı</h3>
                  <p className="text-muted-foreground mb-4">
                    Bu entegre model, iki aşamalı bir optimizasyon yaklaşımı kullanır:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium mb-1">1. Otobüs Tipi Optimizasyonu</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                        <p className="font-mono">
                          Minimize: Toplam Maliyet = Yakıt Maliyeti + Bakım Maliyeti + Amortisman Maliyeti + Sürücü
                          Maliyeti
                        </p>
                        <p className="font-mono mt-2">Kısıtlar:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-1 font-mono">
                          <li>Toplam Kapasite ≥ Zirve Saat Yolcu Sayısı (her hat için)</li>
                          <li>Kullanılan Otobüs Sayısı ≤ Filodaki Mevcut Otobüs Sayısı (her tip için)</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-medium mb-1">2. Sefer Çizelgesi Optimizasyonu</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                        <p className="font-mono">
                          Girdiler: Belirlenen otobüs tipleri, gidiş ve dönüş süreleri, sefer aralıkları
                        </p>
                        <p className="font-mono mt-2">Çıktılar:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-1 font-mono">
                          <li>Her hat için optimal sefer çizelgeleri</li>
                          <li>Her seferin kalkış ve varış zamanları</li>
                          <li>Her sefere atanan otobüs tipi ve numarası</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-gray-400/20 via-teal-400/10 to-gray-400/20 p-[1px] shadow-md">
                <div className="rounded-lg bg-white/95 dark:bg-black/95 backdrop-blur-md p-4">
                  <h3 className="text-lg font-medium mb-2">Algoritma Adımları</h3>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>1. Veri Hazırlama</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Hat verileri (hat no, hat adı, uzunluk, yolcu sayısı) yüklenir</li>
                          <li>
                            Otobüs parametreleri (kapasite, yakıt maliyeti, bakım maliyeti, amortisman maliyeti, karbon
                            emisyonu, filo sayısı) ayarlanır
                          </li>
                          <li>Gidiş ve dönüş süreleri belirlenir</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger>2. Otobüs Tipi Optimizasyonu</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Her hat için, mümkün olan tüm otobüs kombinasyonları değerlendirilir</li>
                          <li>Her kombinasyon için toplam kapasite hesaplanır</li>
                          <li>Yolcu talebini karşılayan kombinasyonlar arasından en düşük maliyetli olan seçilir</li>
                          <li>
                            Seçilen kombinasyon için yakıt, bakım, amortisman, sürücü maliyetleri ve karbon emisyonu
                            hesaplanır
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger>3. Sefer Çizelgesi Optimizasyonu</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Belirlenen otobüs tipleri için sefer çizelgeleri oluşturulur</li>
                          <li>Gidiş ve dönüş süreleri dikkate alınarak optimal sefer aralıkları hesaplanır</li>
                          <li>Her sefere bir otobüs tipi ve numarası atanır</li>
                          <li>Otobüs kullanılabilirliği takip edilir</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger>4. Sonuçların Hesaplanması</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>
                            Her hat için atanan otobüs sayıları, maliyetler, karbon emisyonu ve kapasite kullanım
                            oranları hesaplanır
                          </li>
                          <li>
                            Her hat için sefer çizelgeleri, kalkış ve varış zamanları, atanan otobüs tipleri ve
                            numaraları listelenir
                          </li>
                          <li>
                            Toplam yolcu sayısı, toplam mesafe, toplam yakıt, bakım, amortisman ve sürücü maliyetleri
                            hesaplanır
                          </li>
                          <li>
                            Toplam karbon emisyonu, kişi başı karbon ayak izi ve salınımı engellenen karbon miktarı
                            hesaplanır
                          </li>
                          <li>Tüm sonuçlar kullanıcıya görsel olarak sunulur</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Sıkça Sorulan Sorular
              </CardTitle>
              <CardDescription>Optimizasyon modeli hakkında sık sorulan sorular ve cevapları</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Gidiş ve dönüş süreleri neden ayrı ayrı belirtiliyor?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      Gerçek hayatta, bir hattın gidiş ve dönüş süreleri genellikle farklıdır. Bu farklar, trafik
                      yoğunluğu, yol koşulları, durak sayısı gibi faktörlerden kaynaklanabilir. Farklı süreler dikkate
                      alınarak daha gerçekçi ve verimli sefer çizelgeleri oluşturulabilir.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Otobüs tipi ve sefer çizelgesi optimizasyonları nasıl entegre çalışır?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      İlk aşamada, her hat için yolcu talebine göre en uygun otobüs tipleri belirlenir. İkinci aşamada,
                      belirlenen otobüs tipleri için gidiş ve dönüş süreleri dikkate alınarak optimal sefer çizelgeleri
                      oluşturulur. Bu iki aşamalı yaklaşım, hem maliyet optimizasyonu hem de operasyonel verimlilik
                      sağlar.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Sefer çizelgesinde otobüs numaraları nasıl belirlenir?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      Sefer çizelgesi optimizasyonu sırasında, her otobüs tipine bir numara atanır. Örneğin, midibüsler
                      M1, M2, ..., solo otobüsler S1, S2, ..., körüklü otobüsler K1, K2, ... şeklinde numaralandırılır.
                      Bu numaralar, hangi otobüsün hangi sefere atandığını takip etmek için kullanılır.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>CSV dosyalarını nasıl hazırlamalıyım?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">
                      Otobüs tipi optimizasyonu için CSV dosyanız şu sütunları içermelidir:
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm font-mono mb-2">
                      Hat No;Hat Adı;Hat Uzunluğu;Zirve Saat Yolcu Sayısı
                      <br />
                      1;Kadıköy-Bostancı;12.5;450
                      <br />
                      2;Üsküdar-Ümraniye;8.3;320
                    </div>
                    <p className="text-muted-foreground mt-2">
                      Sefer çizelgesi optimizasyonu için ek olarak gidiş ve dönüş sürelerini içeren bir CSV dosyası
                      hazırlamalısınız.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Sonuçları nasıl dışa aktarabilirim?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      Sonuçlar sekmesinde, sağ üst köşede bulunan "Excel'e Aktar" butonuna tıklayarak tüm sonuçları
                      Excel formatında dışa aktarabilirsiniz. Dışa aktarılan dosya, otobüs tipi optimizasyonu ve sefer
                      çizelgesi sonuçlarını içerir.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
