import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase with the same config as the web app
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyCTvGSJwG06gnKK-d9sgtYX8oGgxCWhfqc",
      authDomain: "doctor-appointment-suite.firebaseapp.com",
      projectId: "doctor-appointment-suite",
      storageBucket: "doctor-appointment-suite.firebasestorage.app",
      messagingSenderId: "342025821668",
      appId: "1:342025821668:android:e2efc42bc75137842b7bf1" // Note: Replaced web appId with android one (usually similar structure)
    ),
  );
  
  runApp(const PatientApp());
}

class PatientApp extends StatelessWidget {
  const PatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cabinet Patient',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
        textTheme: GoogleFonts.manropeTextTheme(),
      ),
      home: const PatientHomeScreen(),
    );
  }
}

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({super.key});

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  String? patientId;

  @override
  Widget build(BuildContext context) {
    if (patientId == null) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F766E), Color(0xFF134E4A)],
            ),
          ),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Card(
                elevation: 20,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F766E).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.activity, size: 48, color: Color(0xFF0F766E)),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Bienvenue',
                        style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Scannez votre QR code pour voir votre position',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const QRScannerScreen()),
                          );
                          if (result != null) {
                            setState(() => patientId = result);
                          }
                        },
                        icon: const Icon(LucideIcons.scanLine),
                        label: const Text('Scanner le QR Code'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F766E),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return PatientStatusView(
      patientId: patientId!,
      onLogout: () => setState(() => patientId = null),
    );
  }
}

class QRScannerScreen extends StatelessWidget {
  const QRScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner QR Code')),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          for (final barcode in barcodes) {
            if (barcode.rawValue != null) {
              Navigator.pop(context, barcode.rawValue);
              break;
            }
          }
        },
      ),
    );
  }
}

class PatientStatusView extends StatelessWidget {
  final String patientId;
  final VoidCallback onLogout;

  const PatientStatusView({super.key, required this.patientId, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('patients').doc(patientId).snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) return const Center(child: Text('Erreur de chargement'));
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
        if (!snapshot.hasData || !snapshot.data!.exists) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Patient non trouvé'),
                  TextButton(onPressed: onLogout, child: const Text('Retour'))
                ],
              ),
            ),
          );
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;
        
        return Scaffold(
          appBar: AppBar(
            title: Text('${data['firstName']} ${data['lastName']}'),
            actions: [IconButton(onPressed: onLogout, icon: const Icon(LucideIcons.logOut))],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildStatusCard(data),
                const SizedBox(height: 16),
                _buildQueueInfo(patientId),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusCard(Map<String, dynamic> data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(LucideIcons.calendar, size: 40, color: Color(0xFF0F766E)),
            const SizedBox(height: 8),
            const Text('Statut de votre rendez-vous', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _StatusBadge(status: data['status'] ?? 'waiting'),
          ],
        ),
      ),
    );
  }

  Widget _buildQueueInfo(String pid) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('queue')
          .where('date', isEqualTo: DateFormat('yyyy-MM-dd').format(DateTime.now()))
          .orderBy('time')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox();
        
        final queue = snapshot.data!.docs;
        int position = -1;
        for (int i = 0; i < queue.length; i++) {
          if (queue[i].id == pid) {
            position = i + 1;
            break;
          }
        }

        if (position == -1) return const SizedBox();

        return Card(
          color: const Color(0xFF0F766E),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Text('Votre position dans la file', style: TextStyle(color: Colors.white70)),
                Text('$position', style: const TextStyle(fontSize: 64, fontWeight: FontWeight.bold, color: Colors.white)),
                Text(
                  position == 1 ? 'Vous êtes le prochain !' : 'Il y a ${position - 1} patients avant vous',
                  style: const TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final styles = {
      'waiting': (color: Colors.orange, label: 'En attente'),
      'confirmed': (color: Colors.blue, label: 'Confirmé'),
      'treated': (color: Colors.green, label: 'Traité'),
      'cancelled': (color: Colors.red, label: 'Annulé'),
    }[status] ?? (color: Colors.grey, label: status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: styles.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: styles.color.withOpacity(0.3)),
      ),
      child: Text(
        styles.label,
        style: TextStyle(color: styles.color, fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }
}