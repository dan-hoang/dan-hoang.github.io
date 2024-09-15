The classes that are meant to be public-
facing are DotNes, Nes, Button, and Av.

A DotNes object represents a .nes file,
the de facto standard for the distribu-
tion of NES games. The DotNes construc-
tor takes a Uint8Array that is a .nes
file. The DotNes class exposes a toRom
method that returns a Rom object usable
by an Nes object.

An Nes object plays a game represented
by a Rom object. The Nes constructor
takes a Rom object. The Nes class expo-
ses a hold method that emulates holding
a button on an NES controller. The hold
method takes values from the Button e-
num. The Nes class also exposes a re-
lease method that emulates releasing a
button on an NES controller. The Nes
class exposes a frame method that exe-
cutes enough code to produce a frame
of output. The Nes class exposes a
getAudioOutput method to retrieve the
audio output of the last executed
frame. The Nes class also exposes a
getVideoOutput method to retrieve the
video output of the last executed
frame.

An Av object connects an Nes object to
an AudioContext object and to a Canvas-
RenderingContext2D object. The Av class
exposes a play method that, at sixty
frames per second, calls the frame me-
thod of the Nes object, retrieves the
output via the getAudioOutput and get-
VideoOutput methods of the Nes object,
and sends the output to the audio and
video contexts.

Now, as for the internals of the Nes
class, an Nes object contains objects
that represent the components of an NES
as well as objects that represent the
connections between those components,
which we will call buses.

For example, the Nes object contains a
Cpu object that represents a CPU. The
Cpu object is responsible for maintain-
ing its internal state. When the Cpu
object requires data from outside, such
as more code to execute, it sends its
associated CpuBus object a request by
calling the read method of the CpuBus
object. The CpuBus object services the
request, and the Cpu object receives
a response. The Cpu takes the response
and updates its internal state accor-
dingly.